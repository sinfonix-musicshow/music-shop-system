using MusicShow.Application.DTOs.Facturas;
using MusicShow.Application.Interfaces;
using MusicShow.Domain.Entities;
using MusicShow.Domain.Exceptions;
using MusicShow.Domain.Interfaces;

namespace MusicShow.Application.Services;

/// <summary>
/// Implementación del caso de uso UC2: Facturación Rápida en Mostrador e Historial de Comprobantes.
/// </summary>
public class FacturaService : IFacturaService
{
    // ── Constantes del emisor (Punto de Venta fijo) ───────────────────────────
    private const int PuntoVentaFijo = 5;
    private const string PrefijoPuntoVenta = "00005";
    private const string UrlConsultaFiscal = "https://www.afip.gob.ar/fe/qr/";

    private readonly IFacturaRepository _facturaRepo;
    private readonly IInstrumentoRepository _instrumentoRepo;
    private readonly IUnitOfWork _uow;

    public FacturaService(
        IFacturaRepository facturaRepo,
        IInstrumentoRepository instrumentoRepo,
        IUnitOfWork uow)
    {
        _facturaRepo     = facturaRepo;
        _instrumentoRepo = instrumentoRepo;
        _uow             = uow;
    }

    // ── Emisión ───────────────────────────────────────────────────────────────

    public async Task<FacturaDto> EmitirAsync(CrearFacturaDto dto)
    {
        await _uow.IniciarTransaccionAsync();

        try
        {
            // 1. Validar y preparar ítems — verificar existencia, actividad y stock
            var detalles = new List<DetalleFactura>();

            foreach (var item in dto.Items)
            {
                var instrumento = await _instrumentoRepo.ObtenerPorIdAsync(item.InstrumentoId)
                    ?? throw new DomainException(
                        $"No se encontró el instrumento con Id {item.InstrumentoId}.");

                if (!instrumento.Activo)
                    throw new DomainException(
                        $"El instrumento '{instrumento.Nombre}' (Id {item.InstrumentoId}) no está activo.");

                if (instrumento.Stock < item.Cantidad)
                    throw new StockInsuficienteException(
                        instrumento.Id,
                        instrumento.Nombre,
                        instrumento.Stock,
                        item.Cantidad);

                // 2. Descontar stock usando el método de dominio existente
                instrumento.AjustarStock(-item.Cantidad);

                detalles.Add(DetalleFactura.Crear(instrumento, item.Cantidad));
            }

            // 3. Calcular total de la factura
            decimal total = detalles.Sum(d => d.Subtotal);

            // 4. Generar número correlativo
            int ultimoCorrelativo = await _facturaRepo.ObtenerUltimoNumeroCorrelativoAsync(PuntoVentaFijo);
            int nuevoCorrelativo  = ultimoCorrelativo + 1;
            string numeroComprobante = $"B-{PrefijoPuntoVenta}-{nuevoCorrelativo:D8}";

            // 5. Simular CAE: 14 dígitos aleatorios
            string cae = GenerarCAESimulado();

            // 6. Crear la factura usando el factory method del dominio
            var factura = Factura.Crear(
                numeroComprobante,
                PuntoVentaFijo,
                dto.NombreCliente ?? "Consumidor Final",
                dto.DocumentoCliente,
                dto.MetodoPago,
                total,
                cae,
                detalles);

            // 7. Persistir
            await _facturaRepo.AgregarAsync(factura);
            await _uow.GuardarCambiosAsync();
            await _uow.ConfirmarTransaccionAsync();

            return MapToFacturaDto(factura);
        }
        catch
        {
            await _uow.RevertirTransaccionAsync();
            throw;
        }
    }

    // ── Consultas ─────────────────────────────────────────────────────────────

    public async Task<IEnumerable<FacturaHistorialItemDto>> ObtenerHistorialAsync(string? filtro)
    {
        var facturas = await _facturaRepo.ObtenerHistorialAsync(filtro);
        return facturas.Select(f => new FacturaHistorialItemDto
        {
            Id                = f.Id,
            NumeroComprobante = f.NumeroComprobante,
            FechaEmision      = f.FechaEmision,
            NombreCliente     = f.NombreCliente,
            Total             = f.Total,
            Estado            = f.Estado
        });
    }

    public async Task<FacturaDto?> ObtenerPorIdAsync(int id)
    {
        var factura = await _facturaRepo.ObtenerPorIdAsync(id);
        return factura is null ? null : MapToFacturaDto(factura);
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    /// <summary>Genera un código CAE de 14 dígitos numéricos aleatorios (simulación ARCA).</summary>
    private static string GenerarCAESimulado()
    {
        var rng = Random.Shared;
        // Primer dígito no puede ser 0 para garantizar 14 dígitos significativos
        long cae = (long)(rng.NextInt64(10_000_000_000_000L, 99_999_999_999_999L));
        return cae.ToString();
    }

    /// <summary>Construye el QR data simulado para consulta fiscal en AFIP/ARCA.</summary>
    private static string ConstruirQrData(Factura f) =>
        $"{UrlConsultaFiscal}?p={f.PuntoVenta:D5}&c=006&n={f.NumeroComprobante}&f={f.FechaEmision:yyyyMMdd}&i={f.Total:F2}&cae={f.CAE}&vcae={f.VencimientoCAE:yyyyMMdd}";

    private static FacturaDto MapToFacturaDto(Factura f) => new()
    {
        Id                = f.Id,
        NumeroComprobante = f.NumeroComprobante,
        TipoComprobante   = f.TipoComprobante,
        PuntoVenta        = f.PuntoVenta,
        FechaEmision      = f.FechaEmision,
        NombreCliente     = f.NombreCliente,
        DocumentoCliente  = f.DocumentoCliente,
        MetodoPago        = f.MetodoPago,
        SubtotalNeto      = f.SubtotalNeto,
        Iva               = f.Iva,
        Total             = f.Total,
        CAE               = f.CAE,
        VencimientoCAE    = f.VencimientoCAE,
        Estado            = f.Estado,
        QrData            = ConstruirQrData(f),
        Detalles          = f.Detalles.Select(d => new DetalleFacturaDto
        {
            Id                = d.Id,
            InstrumentoId     = d.InstrumentoId,
            CodigoInstrumento = d.CodigoInstrumento,
            NombreInstrumento = d.NombreInstrumento,
            Cantidad          = d.Cantidad,
            PrecioUnitario    = d.PrecioUnitario,
            Subtotal          = d.Subtotal
        }).ToList()
    };
}

