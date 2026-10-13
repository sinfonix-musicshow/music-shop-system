namespace MusicShow.Domain.Entities;

/// <summary>
/// Representa una factura emitida en el punto de venta.
/// </summary>
public class Factura
{
    // Constructor privado requerido por EF Core
    private Factura() { }

    public int Id { get; private set; }

    /// <summary>Número correlativo con formato B-00005-XXXXXXXX.</summary>
    public string NumeroComprobante { get; private set; } = string.Empty;

    /// <summary>Tipo de comprobante, por defecto "Factura B".</summary>
    public string TipoComprobante { get; private set; } = "Factura B";

    /// <summary>Número de punto de venta fijo (5).</summary>
    public int PuntoVenta { get; private set; }

    public DateTime FechaEmision { get; private set; }

    public string NombreCliente { get; private set; } = "Consumidor Final";

    /// <summary>DNI o CUIT del cliente (opcional).</summary>
    public string? DocumentoCliente { get; private set; }

    /// <summary>Método de pago: Efectivo, Débito, Transferencia, Crédito.</summary>
    public string MetodoPago { get; private set; } = string.Empty;

    /// <summary>Monto neto sin IVA (Total / 1.21).</summary>
    public decimal SubtotalNeto { get; private set; }

    /// <summary>IVA 21% (Total - SubtotalNeto).</summary>
    public decimal Iva { get; private set; }

    /// <summary>Importe total final (con IVA incluido).</summary>
    public decimal Total { get; private set; }

    /// <summary>Código de Autorización Electrónico de 14 dígitos (simulado).</summary>
    public string CAE { get; private set; } = string.Empty;

    public DateTime VencimientoCAE { get; private set; }

    /// <summary>Estado: "Autorizada" o "Anulada".</summary>
    public string Estado { get; private set; } = "Autorizada";

    public ICollection<DetalleFactura> Detalles { get; private set; } = new List<DetalleFactura>();

    // ── Factory method ────────────────────────────────────────────────────────

    /// <summary>
    /// Crea una nueva factura autorizada con todos sus datos fiscales calculados.
    /// </summary>
    public static Factura Crear(
        string numeroComprobante,
        int puntoVenta,
        string nombreCliente,
        string? documentoCliente,
        string metodoPago,
        decimal total,
        string cae,
        IEnumerable<DetalleFactura> detalles)
    {
        var ahora = DateTime.UtcNow;
        var subtotalNeto = Math.Round(total / 1.21m, 2);
        var iva = Math.Round(total - subtotalNeto, 2);

        var factura = new Factura
        {
            NumeroComprobante = numeroComprobante,
            TipoComprobante   = "Factura B",
            PuntoVenta        = puntoVenta,
            FechaEmision      = ahora,
            NombreCliente     = string.IsNullOrWhiteSpace(nombreCliente) ? "Consumidor Final" : nombreCliente,
            DocumentoCliente  = documentoCliente,
            MetodoPago        = metodoPago,
            SubtotalNeto      = subtotalNeto,
            Iva               = iva,
            Total             = total,
            CAE               = cae,
            VencimientoCAE    = ahora.AddDays(10),
            Estado            = "Autorizada"
        };

        foreach (var detalle in detalles)
            factura.Detalles.Add(detalle);

        return factura;
    }

    // ── Métodos de dominio ────────────────────────────────────────────────────

    /// <summary>Anula la factura (baja lógica).</summary>
    public void Anular()
    {
        Estado = "Anulada";
    }
}

