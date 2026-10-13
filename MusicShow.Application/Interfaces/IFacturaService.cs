using MusicShow.Application.DTOs.Facturas;

namespace MusicShow.Application.Interfaces;

/// <summary>
/// Contrato del servicio de facturación (UC2).
/// </summary>
public interface IFacturaService
{
    /// <summary>
    /// Emite una nueva factura: valida stock, descuenta inventario,
    /// genera número correlativo y CAE simulado, todo en una transacción atómica.
    /// </summary>
    Task<FacturaDto> EmitirAsync(CrearFacturaDto dto);

    /// <summary>
    /// Devuelve el historial de comprobantes (vista compacta) ordenado por fecha descendente.
    /// Permite filtrar por número de comprobante o nombre de cliente.
    /// </summary>
    Task<IEnumerable<FacturaHistorialItemDto>> ObtenerHistorialAsync(string? filtro);

    /// <summary>
    /// Devuelve el detalle completo de una factura para reimpresión o consulta.
    /// </summary>
    Task<FacturaDto?> ObtenerPorIdAsync(int id);
}

