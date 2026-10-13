using Microsoft.EntityFrameworkCore;
using MusicShow.Data.Context;
using MusicShow.Domain.Entities;
using MusicShow.Domain.Interfaces;

namespace MusicShow.Data.Repositories;

/// <summary>
/// Implementación EF Core del repositorio de facturas.
/// </summary>
public class FacturaRepository : IFacturaRepository
{
    private readonly MusicShowDbContext _context;

    public FacturaRepository(MusicShowDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Factura>> ObtenerHistorialAsync(string? filtro)
    {
        var query = _context.Facturas
                            .Include(f => f.Detalles)
                            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro))
        {
            string term = filtro.ToLower();
            query = query.Where(f =>
                f.NumeroComprobante.ToLower().Contains(term) ||
                f.NombreCliente.ToLower().Contains(term));
        }

        return await query
            .OrderByDescending(f => f.FechaEmision)
            .ToListAsync();
    }

    public async Task<Factura?> ObtenerPorIdAsync(int id)
        => await _context.Facturas
                         .Include(f => f.Detalles)
                         .FirstOrDefaultAsync(f => f.Id == id);

    public async Task<int> ObtenerUltimoNumeroCorrelativoAsync(int puntoVenta)
    {
        // Extrae el correlativo numérico del campo NumeroComprobante (formato B-XXXXX-XXXXXXXX)
        var facturas = await _context.Facturas
            .Where(f => f.PuntoVenta == puntoVenta)
            .Select(f => f.NumeroComprobante)
            .ToListAsync();

        if (!facturas.Any())
            return 0;

        return facturas
            .Select(n => n.Split('-'))
            .Where(partes => partes.Length == 3 && int.TryParse(partes[2], out _))
            .Select(partes => int.Parse(partes[2]))
            .DefaultIfEmpty(0)
            .Max();
    }

    public async Task AgregarAsync(Factura factura)
        => await _context.Facturas.AddAsync(factura);
}

