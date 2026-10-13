using MusicShow.Application.DTOs.Catalogo;

namespace MusicShow.Application.Interfaces;

/// <summary>
/// Contrato del servicio de aplicación para la gestión del catálogo comercial de instrumentos.
/// </summary>
public interface ICatalogoService
{
    /// <summary>
    /// Obtiene todos los instrumentos publicados en el catálogo, con filtro opcional por categoría.
    /// </summary>
    Task<IEnumerable<CatalogoItemResponse>> ObtenerCatalogoAsync(string? categoria = null);

    /// <summary>
    /// Agrega un instrumento específico al catálogo comercial.
    /// </summary>
    Task<CatalogoItemResponse> AgregarAlCatalogoAsync(int instrumentoId);

    /// <summary>
    /// Agrega un lote de instrumentos al catálogo comercial.
    /// Retorna la cantidad de instrumentos efectivamente incorporados.
    /// </summary>
    Task<int> AgregarLoteAlCatalogoAsync(AgregarLoteCatalogoRequest request);

    /// <summary>
    /// Remueve un instrumento del catálogo comercial (sigue existiendo en inventario).
    /// </summary>
    Task RemoverDelCatalogoAsync(int instrumentoId);
}
