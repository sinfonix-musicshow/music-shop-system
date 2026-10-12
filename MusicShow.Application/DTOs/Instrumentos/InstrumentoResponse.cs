namespace MusicShow.Application.DTOs.Instrumentos;

/// <summary>
/// DTO de respuesta con los datos de un instrumento.
/// </summary>
public class InstrumentoResponse
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public int Stock { get; set; }
    public decimal Precio { get; set; }
    public string? EmojiIcon { get; set; }
    public bool Activo { get; set; }
}

