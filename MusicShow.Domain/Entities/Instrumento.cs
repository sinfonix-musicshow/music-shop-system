using MusicShow.Domain.Exceptions;

namespace MusicShow.Domain.Entities;

/// <summary>
/// Entidad que representa un instrumento musical en el inventario.
/// </summary>
public class Instrumento
{
    public int Id { get; private set; }

    public string Codigo { get; private set; } = string.Empty;

    public string Nombre { get; private set; } = string.Empty;

    public string Marca { get; private set; } = string.Empty;

    public string Categoria { get; private set; } = string.Empty;

    public int Stock { get; private set; }

    public decimal Precio { get; private set; }

    public string? EmojiIcon { get; private set; }

    public bool Activo { get; private set; }

    public string? UrlImagen { get; set; }

    // Constructor requerido por EF Core
    private Instrumento() { }

    /// <summary>
    /// Crea un nuevo instrumento aplicando las reglas de negocio.
    /// </summary>
    public Instrumento(string codigo, string nombre, string marca, string categoria,
                       int stock, decimal precio, string? emojiIcon = null)
    {
        ValidarCodigo(codigo);
        ValidarNombre(nombre);
        ValidarMarca(marca);
        ValidarCategoria(categoria);
        ValidarStock(stock);
        ValidarPrecio(precio);

        Codigo = codigo;
        Nombre = nombre;
        Marca = marca;
        Categoria = categoria;
        Stock = stock;
        Precio = precio;
        EmojiIcon = emojiIcon;
        Activo = true;
    }

    // ── Métodos de dominio ────────────────────────────────────────────────────

    /// <summary>
    /// Actualiza los datos generales del instrumento.
    /// </summary>
    public void Actualizar(string nombre, string marca, string categoria,
                           decimal precio, string? emojiIcon)
    {
        ValidarNombre(nombre);
        ValidarMarca(marca);
        ValidarCategoria(categoria);
        ValidarPrecio(precio);

        Nombre = nombre;
        Marca = marca;
        Categoria = categoria;
        Precio = precio;
        EmojiIcon = emojiIcon;
    }

    /// <summary>
    /// Ajusta el stock mediante un delta (positivo = entrada, negativo = salida).
    /// Garantiza que el stock resultante nunca sea menor a 0.
    /// </summary>
    public void AjustarStock(int delta)
    {
        int nuevoStock = Stock + delta;
        if (nuevoStock < 0)
            throw new DomainException(
                $"El ajuste de stock resultaría en un valor negativo ({nuevoStock}). Stock actual: {Stock}.");

        Stock = nuevoStock;
    }

    /// <summary>
    /// Establece el stock en un valor absoluto (debe ser >= 0).
    /// </summary>
    public void EstablecerStock(int cantidad)
    {
        if (cantidad < 0)
            throw new DomainException("El stock no puede ser un valor negativo.");

        Stock = cantidad;
    }

    /// <summary>
    /// Realiza la baja lógica del instrumento.
    /// </summary>
    public void Desactivar()
    {
        Activo = false;
    }

    // ── Validaciones privadas ─────────────────────────────────────────────────

    private static void ValidarCodigo(string codigo)
    {
        if (string.IsNullOrWhiteSpace(codigo))
            throw new DomainException("El código del instrumento es obligatorio.");
    }

    private static void ValidarNombre(string nombre)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new DomainException("El nombre del instrumento es obligatorio.");
    }

    private static void ValidarMarca(string marca)
    {
        if (string.IsNullOrWhiteSpace(marca))
            throw new DomainException("La marca del instrumento es obligatoria.");
    }

    private static void ValidarCategoria(string categoria)
    {
        if (string.IsNullOrWhiteSpace(categoria))
            throw new DomainException("La categoría del instrumento es obligatoria.");
    }

    private static void ValidarStock(int stock)
    {
        if (stock < 0)
            throw new DomainException("El stock inicial no puede ser negativo.");
    }

    private static void ValidarPrecio(decimal precio)
    {
        if (precio <= 0)
            throw new DomainException("El precio debe ser un valor estrictamente mayor a 0.");
    }
}

