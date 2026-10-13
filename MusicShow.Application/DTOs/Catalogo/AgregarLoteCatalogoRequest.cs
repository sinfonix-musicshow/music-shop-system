using System.ComponentModel.DataAnnotations;

namespace MusicShow.Application.DTOs.Catalogo;

/// <summary>
/// DTO de solicitud para agregar múltiples instrumentos al catálogo en una sola operación.
/// </summary>
public class AgregarLoteCatalogoRequest
{
    [Required(ErrorMessage = "La lista de identificadores es obligatoria.")]
    [MinLength(1, ErrorMessage = "Debe proporcionar al menos un identificador de instrumento.")]
    public List<int> InstrumentoIds { get; set; } = new();
}
