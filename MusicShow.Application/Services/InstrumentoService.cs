using MusicShow.Application.DTOs.Instrumentos;
using MusicShow.Application.Interfaces;
using MusicShow.Domain.Entities;
using MusicShow.Domain.Exceptions;
using MusicShow.Domain.Interfaces;

namespace MusicShow.Application.Services;

/// <summary>
/// Implementación del caso de uso UC1: Gestionar Inventario y Stock de Instrumentos.
/// </summary>
public class InstrumentoService : IInstrumentoService
{
    private readonly IInstrumentoRepository _repo;

    public InstrumentoService(IInstrumentoRepository repo)
    {
        _repo = repo;
    }

    // ── Consultas ─────────────────────────────────────────────────────────────

    public async Task<IEnumerable<InstrumentoResponse>> ObtenerTodosAsync(string? busqueda, string? categoria)
    {
        var instrumentos = await _repo.ObtenerTodosAsync(busqueda, categoria);
        return instrumentos.Select(MapToResponse);
    }

    public async Task<InstrumentoResponse?> ObtenerPorIdAsync(int id)
    {
        var instrumento = await _repo.ObtenerPorIdAsync(id);
        return instrumento is null ? null : MapToResponse(instrumento);
    }

    // ── Comandos ──────────────────────────────────────────────────────────────

    public async Task<InstrumentoResponse> CrearAsync(CrearInstrumentoRequest request)
    {
        bool codigoExiste = await _repo.ExisteCodigoAsync(request.Codigo);
        if (codigoExiste)
            throw new DomainException($"Ya existe un instrumento con el código '{request.Codigo}'.");

        var instrumento = new Instrumento(
            request.Codigo,
            request.Nombre,
            request.Marca,
            request.Categoria,
            request.Stock,
            request.Precio,
            request.EmojiIcon);

        await _repo.AgregarAsync(instrumento);
        await _repo.GuardarCambiosAsync();

        return MapToResponse(instrumento);
    }

    public async Task<InstrumentoResponse> ActualizarAsync(int id, ActualizarInstrumentoRequest request)
    {
        var instrumento = await ObtenerOLanzarAsync(id);

        instrumento.Actualizar(
            request.Nombre,
            request.Marca,
            request.Categoria,
            request.Precio,
            request.EmojiIcon);

        await _repo.GuardarCambiosAsync();

        return MapToResponse(instrumento);
    }

    public async Task<InstrumentoResponse> AjustarStockAsync(int id, AjustarStockRequest request)
    {
        var instrumento = await ObtenerOLanzarAsync(id);

        if (request.EsAbsoluto)
            instrumento.EstablecerStock(request.Valor);
        else
            instrumento.AjustarStock(request.Valor);

        await _repo.GuardarCambiosAsync();

        return MapToResponse(instrumento);
    }

    public async Task EliminarAsync(int id)
    {
        var instrumento = await ObtenerOLanzarAsync(id);
        instrumento.Desactivar();
        await _repo.GuardarCambiosAsync();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<Instrumento> ObtenerOLanzarAsync(int id)
    {
        var instrumento = await _repo.ObtenerPorIdAsync(id);
        if (instrumento is null)
            throw new DomainException($"No se encontró el instrumento con Id {id}.");
        return instrumento;
    }

    private static InstrumentoResponse MapToResponse(Instrumento i) => new()
    {
        Id        = i.Id,
        Codigo    = i.Codigo,
        Nombre    = i.Nombre,
        Marca     = i.Marca,
        Categoria = i.Categoria,
        Stock     = i.Stock,
        Precio    = i.Precio,
        EmojiIcon = i.EmojiIcon,
        Activo    = i.Activo
    };
}

