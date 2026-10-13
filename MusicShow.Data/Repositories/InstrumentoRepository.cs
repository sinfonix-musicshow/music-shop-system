using Microsoft.EntityFrameworkCore;
using MusicShow.Data.Context;
using MusicShow.Domain.Entities;
using MusicShow.Domain.Interfaces;

namespace MusicShow.Data.Repositories;

/// <summary>
/// Implementación EF Core del repositorio de instrumentos.
/// </summary>
public class InstrumentoRepository : IInstrumentoRepository
{
    private readonly MusicShowDbContext _context;

    public InstrumentoRepository(MusicShowDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Instrumento>> ObtenerTodosAsync(string? busqueda, string? categoria)
    {
        var query = _context.Instrumentos
                            .Where(i => i.Activo)
                            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            string term = busqueda.ToLower();
            query = query.Where(i =>
                i.Nombre.ToLower().Contains(term) ||
                i.Codigo.ToLower().Contains(term) ||
                i.Marca.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(categoria))
            query = query.Where(i => i.Categoria.ToLower() == categoria.ToLower());

        return await query.ToListAsync();
    }

    public async Task<Instrumento?> ObtenerPorIdAsync(int id)
        => await _context.Instrumentos.FirstOrDefaultAsync(i => i.Id == id);

    public async Task<bool> ExisteCodigoAsync(string codigo)
        => await _context.Instrumentos.AnyAsync(i => i.Codigo == codigo);

    public async Task AgregarAsync(Instrumento instrumento)
        => await _context.Instrumentos.AddAsync(instrumento);

    public async Task<IEnumerable<Instrumento>> ObtenerEnCatalogoAsync(string? categoria = null)
    {
        var query = _context.Instrumentos
                            .Where(i => i.Activo && i.EnCatalogo)
                            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(categoria))
            query = query.Where(i => i.Categoria.ToLower() == categoria.ToLower());

        return await query.ToListAsync();
    }

    public async Task<IEnumerable<Instrumento>> ObtenerPorIdsAsync(IEnumerable<int> ids)
    {
        var idList = ids.Distinct().ToList();
        return await _context.Instrumentos
                             .Where(i => idList.Contains(i.Id) && i.Activo)
                             .ToListAsync();
    }

    public async Task GuardarCambiosAsync()
        => await _context.SaveChangesAsync();
}

