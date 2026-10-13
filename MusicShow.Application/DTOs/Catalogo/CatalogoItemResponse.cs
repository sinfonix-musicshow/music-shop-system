namespace MusicShow.Application.DTOs.Catalogo;

/// <summary>
/// DTO de respuesta que expone la información comercial de un instrumento en el catálogo.
/// </summary>
public class CatalogoItemResponse
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public int Stock { get; set; }
    public decimal Precio { get; set; }
    public string? EmojiIcon { get; set; }
}
