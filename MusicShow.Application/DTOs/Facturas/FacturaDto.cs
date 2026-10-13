namespace MusicShow.Application.DTOs.Facturas;

/// <summary>
/// DTO de respuesta con el detalle completo de una factura (para impresión o consulta).
/// </summary>
public class FacturaDto
{
    public int Id { get; set; }
    public string NumeroComprobante { get; set; } = string.Empty;
    public string TipoComprobante { get; set; } = string.Empty;
    public int PuntoVenta { get; set; }
    public DateTime FechaEmision { get; set; }
    public string NombreCliente { get; set; } = string.Empty;
    public string? DocumentoCliente { get; set; }
    public string MetodoPago { get; set; } = string.Empty;
    public decimal SubtotalNeto { get; set; }
    public decimal Iva { get; set; }
    public decimal Total { get; set; }
    public string CAE { get; set; } = string.Empty;
    public DateTime VencimientoCAE { get; set; }
    public string Estado { get; set; } = string.Empty;
    /// <summary>URL/string simulado para generar el QR de consulta fiscal.</summary>
    public string QrData { get; set; } = string.Empty;
    public List<DetalleFacturaDto> Detalles { get; set; } = [];
}

/// <summary>
/// DTO de una línea de detalle de factura.
/// </summary>
public class DetalleFacturaDto
{
    public int Id { get; set; }
    public int InstrumentoId { get; set; }
    public string CodigoInstrumento { get; set; } = string.Empty;
    public string NombreInstrumento { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}

/// <summary>
/// DTO compacto para la tabla de historial de comprobantes.
/// </summary>
public class FacturaHistorialItemDto
{
    public int Id { get; set; }
    public string NumeroComprobante { get; set; } = string.Empty;
    public DateTime FechaEmision { get; set; }
    public string NombreCliente { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Estado { get; set; } = string.Empty;
}

