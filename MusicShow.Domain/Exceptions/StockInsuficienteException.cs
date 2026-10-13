namespace MusicShow.Domain.Exceptions;

/// <summary>
/// Excepción lanzada cuando no hay stock suficiente para completar una venta.
/// Contiene información estructurada del instrumento afectado.
/// </summary>
public class StockInsuficienteException : DomainException
{
    public int InstrumentoId { get; }
    public string NombreInstrumento { get; }
    public int StockDisponible { get; }
    public int CantidadSolicitada { get; }

    public StockInsuficienteException(
        int instrumentoId,
        string nombreInstrumento,
        int stockDisponible,
        int cantidadSolicitada)
        : base($"Stock insuficiente para '{nombreInstrumento}' (Id {instrumentoId}). " +
               $"Disponible: {stockDisponible}, solicitado: {cantidadSolicitada}.")
    {
        InstrumentoId       = instrumentoId;
        NombreInstrumento   = nombreInstrumento;
        StockDisponible     = stockDisponible;
        CantidadSolicitada  = cantidadSolicitada;
    }
}

