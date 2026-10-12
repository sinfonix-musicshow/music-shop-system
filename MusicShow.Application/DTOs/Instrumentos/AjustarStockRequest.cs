namespace MusicShow.Application.DTOs.Instrumentos;

/// <summary>
/// DTO para ajustar el stock de un instrumento.
/// Se puede usar como delta relativo o como cantidad absoluta.
/// </summary>
public class AjustarStockRequest
{
    /// <summary>
    /// Cuando es true, <see cref="Valor"/> representa el nuevo stock absoluto (>= 0).
    /// Cuando es false (default), <see cref="Valor"/> es un delta (positivo o negativo).
    /// </summary>
    public bool EsAbsoluto { get; set; } = false;

    /// <summary>
    /// Delta de stock (positivo = entrada, negativo = salida)
    /// o cantidad absoluta si <see cref="EsAbsoluto"/> es true.
    /// </summary>
    public int Valor { get; set; }
}

