using MusicShow.Domain.Entities;

namespace MusicShow.Domain.Interfaces;

/// <summary>
/// Contrato del repositorio de facturas (definido en dominio, implementado en datos).
/// </summary>
public interface IFacturaRepository
{
    /// <summary>
    /// Devuelve el historial de facturas ordenadas por fecha descendente,
    /// con filtro opcional por número de comprobante o nombre de cliente.
    /// </summary>
    Task<IEnumerable<Factura>> ObtenerHistorialAsync(string? filtro);

    /// <summary>
    /// Devuelve una factura con sus detalles por ID, o null si no existe.
    /// </summary>
    Task<Factura?> ObtenerPorIdAsync(int id);

    /// <summary>
    /// Devuelve el número correlativo más alto registrado para el punto de venta indicado.
    /// </summary>
    Task<int> ObtenerUltimoNumeroCorrelativoAsync(int puntoVenta);

    /// <summary>
    /// Agrega una nueva factura al contexto (sin guardar aún).
    /// </summary>
    Task AgregarAsync(Factura factura);
}

