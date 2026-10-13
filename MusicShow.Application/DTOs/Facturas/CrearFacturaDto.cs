using System.ComponentModel.DataAnnotations;

namespace MusicShow.Application.DTOs.Facturas;

/// <summary>
/// DTO de entrada para emitir una nueva factura.
/// </summary>
public class CrearFacturaDto
{
    /// <summary>Nombre del cliente (default: "Consumidor Final").</summary>
    public string? NombreCliente { get; set; }

    /// <summary>DNI o CUIT del cliente (opcional).</summary>
    public string? DocumentoCliente { get; set; }

    /// <summary>Método de pago: Efectivo, Débito, Transferencia, Crédito.</summary>
    [Required(ErrorMessage = "El método de pago es obligatorio.")]
    public string MetodoPago { get; set; } = "Efectivo";

    /// <summary>Lista de ítems a facturar.</summary>
    [Required]
    [MinLength(1, ErrorMessage = "La factura debe tener al menos un ítem.")]
    public List<CrearItemFacturaDto> Items { get; set; } = [];
}

/// <summary>
/// Un ítem de la orden de facturación.
/// </summary>
public class CrearItemFacturaDto
{
    [Range(1, int.MaxValue, ErrorMessage = "El InstrumentoId debe ser mayor a 0.")]
    public int InstrumentoId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser al menos 1.")]
    public int Cantidad { get; set; }
}

