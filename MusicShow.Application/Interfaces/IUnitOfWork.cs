namespace MusicShow.Application.Interfaces;

/// <summary>
/// Abstracción de Unit of Work para coordinar transacciones entre repositorios.
/// </summary>
public interface IUnitOfWork : IDisposable
{
    Task<int> GuardarCambiosAsync(CancellationToken cancellationToken = default);

    Task IniciarTransaccionAsync();

    Task ConfirmarTransaccionAsync();

    Task RevertirTransaccionAsync();
}

