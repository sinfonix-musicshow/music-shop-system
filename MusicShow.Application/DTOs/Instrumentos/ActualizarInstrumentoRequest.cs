using System.ComponentModel.DataAnnotations;

namespace MusicShow.Application.DTOs.Instrumentos;

/// <summary>
/// DTO de entrada para actualizar los datos generales de un instrumento.
/// </summary>
public class ActualizarInstrumentoRequest
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "La marca es obligatoria.")]
    [MaxLength(100)]
    public string Marca { get; set; } = string.Empty;

    [Required(ErrorMessage = "La categoría es obligatoria.")]
    [MaxLength(100)]
    public string Categoria { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "El precio debe ser mayor a 0.")]
    public decimal Precio { get; set; }

    [MaxLength(10)]
    public string? EmojiIcon { get; set; }

    public string? UrlImagen { get; set; }
}

