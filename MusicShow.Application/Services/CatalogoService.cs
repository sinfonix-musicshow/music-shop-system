using MusicShow.Application.DTOs.Catalogo;
using MusicShow.Application.Interfaces;
using MusicShow.Domain.Entities;
using MusicShow.Domain.Exceptions;
using MusicShow.Domain.Interfaces;

namespace MusicShow.Application.Services;

/// <summary>
/// Implementación de los casos de uso para la gestión y visualización del catálogo comercial.
/// </summary>
public class CatalogoService : ICatalogoService
{
    private readonly IInstrumentoRepository _repo;

    public CatalogoService(IInstrumentoRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<CatalogoItemResponse>> ObtenerCatalogoAsync(string? categoria = null)
    {
        var instrumentos = await _repo.ObtenerEnCatalogoAsync(categoria);
        return instrumentos.Select(MapToResponse);
    }

    public async Task<CatalogoItemResponse> AgregarAlCatalogoAsync(int instrumentoId)
    {
        var instrumento = await _repo.ObtenerPorIdAsync(instrumentoId);
        if (instrumento is null)
            throw new DomainException($"No se encontró el instrumento con Id {instrumentoId}.");

        instrumento.PublicarEnCatalogo();
        await _repo.GuardarCambiosAsync();

        return MapToResponse(instrumento);
    }

    public async Task<int> AgregarLoteAlCatalogoAsync(AgregarLoteCatalogoRequest request)
    {
        if (request.InstrumentoIds is null || !request.InstrumentoIds.Any())
            throw new DomainException("Debe proporcionar al menos un ID de instrumento para agregar al catálogo.");

        var instrumentos = await _repo.ObtenerPorIdsAsync(request.InstrumentoIds);
        var lista = instrumentos.ToList();

        if (!lista.Any())
            throw new DomainException("No se encontró ninguno de los instrumentos especificados.");

        foreach (var instrumento in lista)
        {
            instrumento.PublicarEnCatalogo();
        }

        await _repo.GuardarCambiosAsync();
        return lista.Count;
    }

    public async Task RemoverDelCatalogoAsync(int instrumentoId)
    {
        var instrumento = await _repo.ObtenerPorIdAsync(instrumentoId);
        if (instrumento is null)
            throw new DomainException($"No se encontró el instrumento con Id {instrumentoId}.");

        instrumento.QuitarDeCatalogo();
        await _repo.GuardarCambiosAsync();
    }

    private static CatalogoItemResponse MapToResponse(Instrumento i) => new()
    {
        Id        = i.Id,
        Nombre    = i.Nombre,
        Marca     = i.Marca,
        Categoria = i.Categoria,
        Stock     = i.Stock,
        Precio    = i.Precio,
        EmojiIcon = i.EmojiIcon
    };
}
