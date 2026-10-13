using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using MusicShow.Application.Interfaces;
using MusicShow.Data.Context;

namespace MusicShow.Data;

/// <summary>
/// Implementación del Unit of Work sobre el DbContext de EF Core.
/// Coordina transacciones explícitas entre repositorios.
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly MusicShowDbContext _context;
    private IDbContextTransaction? _transaccion;

    public UnitOfWork(MusicShowDbContext context)
    {
        _context = context;
    }

    public async Task IniciarTransaccionAsync()
    {
        _transaccion = await _context.Database.BeginTransactionAsync();
    }

    public async Task ConfirmarTransaccionAsync()
    {
        if (_transaccion is null)
            throw new InvalidOperationException("No hay una transacción activa para confirmar.");

        await _transaccion.CommitAsync();
        await _transaccion.DisposeAsync();
        _transaccion = null;
    }

    public async Task RevertirTransaccionAsync()
    {
        if (_transaccion is not null)
        {
            await _transaccion.RollbackAsync();
            await _transaccion.DisposeAsync();
            _transaccion = null;
        }
    }

    public async Task<int> GuardarCambiosAsync(CancellationToken cancellationToken = default)
        => await _context.SaveChangesAsync(cancellationToken);

    public void Dispose()
    {
        _transaccion?.Dispose();
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}

