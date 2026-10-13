namespace MusicShow.Domain.Entities;

/// <summary>
/// Línea de detalle de una factura. Congela datos del instrumento al momento de la venta.
/// </summary>
public class DetalleFactura
{
    // Constructor privado requerido por EF Core
    private DetalleFactura() { }

    public int Id { get; private set; }

    public int FacturaId { get; private set; }

    public int InstrumentoId { get; private set; }

    /// <summary>Código del instrumento congelado en el momento de la venta.</summary>
    public string CodigoInstrumento { get; private set; } = string.Empty;

    /// <summary>Nombre del instrumento congelado en el momento de la venta.</summary>
    public string NombreInstrumento { get; private set; } = string.Empty;

    public int Cantidad { get; private set; }

    /// <summary>Precio unitario congelado al momento de la venta.</summary>
    public decimal PrecioUnitario { get; private set; }

    /// <summary>Subtotal = Cantidad * PrecioUnitario.</summary>
    public decimal Subtotal { get; private set; }

    // Navegación
    public Factura? Factura { get; private set; }
    public Instrumento? Instrumento { get; private set; }

    // ── Factory method ────────────────────────────────────────────────────────

    /// <summary>
    /// Crea un detalle a partir de un instrumento, congelando sus datos actuales.
    /// </summary>
    public static DetalleFactura Crear(Instrumento instrumento, int cantidad)
    {
        return new DetalleFactura
        {
            InstrumentoId    = instrumento.Id,
            CodigoInstrumento = instrumento.Codigo,
            NombreInstrumento = instrumento.Nombre,
            Cantidad         = cantidad,
            PrecioUnitario   = instrumento.Precio,
            Subtotal         = instrumento.Precio * cantidad
        };
    }
}

