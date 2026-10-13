using MusicShow.Domain.Entities;

namespace MusicShow.Domain.Interfaces;

/// <summary>
/// Contrato del repositorio de instrumentos (definido en el dominio,
/// implementado en la capa de datos).
/// </summary>
public interface IInstrumentoRepository
{
    /// <summary>
    /// Devuelve todos los instrumentos activos, con filtros opcionales.
    /// </summary>
    Task<IEnumerable<Instrumento>> ObtenerTodosAsync(string? busqueda, string? categoria);

    /// <summary>
    /// Devuelve un instrumento por su identificador, o null si no existe.
    /// </summary>
    Task<Instrumento?> ObtenerPorIdAsync(int id);

    /// <summary>
    /// Verifica si ya existe un instrumento con el código dado.
    /// </summary>
    Task<bool> ExisteCodigoAsync(string codigo);

    /// <summary>
    /// Agrega un nuevo instrumento al repositorio.
    /// </summary>
    Task AgregarAsync(Instrumento instrumento);

    /// <summary>
    /// Devuelve todos los instrumentos activos que están marcados para mostrarse en el catálogo.
    /// </summary>
    Task<IEnumerable<Instrumento>> ObtenerEnCatalogoAsync(string? categoria = null);

    /// <summary>
    /// Devuelve los instrumentos activos correspondientes a la lista de identificadores.
    /// </summary>
    Task<IEnumerable<Instrumento>> ObtenerPorIdsAsync(IEnumerable<int> ids);

    /// <summary>
    /// Persiste los cambios realizados sobre una entidad rastreada.
    /// </summary>
    Task GuardarCambiosAsync();
}

