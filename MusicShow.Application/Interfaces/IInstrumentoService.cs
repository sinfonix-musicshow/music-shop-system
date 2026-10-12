using MusicShow.Application.DTOs.Instrumentos;

namespace MusicShow.Application.Interfaces;

/// <summary>
/// Contrato del servicio de aplicación para la gestión de instrumentos.
/// </summary>
public interface IInstrumentoService
{
    Task<IEnumerable<InstrumentoResponse>> ObtenerTodosAsync(string? busqueda, string? categoria);

    Task<InstrumentoResponse?> ObtenerPorIdAsync(int id);

    Task<InstrumentoResponse> CrearAsync(CrearInstrumentoRequest request);

    Task<InstrumentoResponse> ActualizarAsync(int id, ActualizarInstrumentoRequest request);

    Task<InstrumentoResponse> AjustarStockAsync(int id, AjustarStockRequest request);

    Task EliminarAsync(int id);
}

