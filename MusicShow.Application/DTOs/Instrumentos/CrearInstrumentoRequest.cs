using System.ComponentModel.DataAnnotations;

namespace MusicShow.Application.DTOs.Instrumentos;

/// <summary>
/// DTO de entrada para registrar un nuevo instrumento.
/// </summary>
public class CrearInstrumentoRequest
{
    [Required(ErrorMessage = "El código es obligatorio.")]
    [MaxLength(50)]
    public string Codigo { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "La marca es obligatoria.")]
    [MaxLength(100)]
    public string Marca { get; set; } = string.Empty;

    [Required(ErrorMessage = "La categoría es obligatoria.")]
    [MaxLength(100)]
    public string Categoria { get; set; } = string.Empty;

    [Range(0, int.MaxValue, ErrorMessage = "El stock inicial no puede ser negativo.")]
    public int Stock { get; set; } = 0;

    [Range(0.01, double.MaxValue, ErrorMessage = "El precio debe ser mayor a 0.")]
    public decimal Precio { get; set; }

    [MaxLength(10)]
    public string? EmojiIcon { get; set; }

    public string? UrlImagen { get; set; }
}

