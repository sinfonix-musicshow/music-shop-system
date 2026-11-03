using Microsoft.EntityFrameworkCore;
using MusicShow.Domain.Entities;

namespace MusicShow.Data.Context;

/// <summary>
/// DbContext principal de la aplicación MusicShow.
/// </summary>
public class MusicShowDbContext : DbContext
{
    public MusicShowDbContext(DbContextOptions<MusicShowDbContext> options)
        : base(options) { }

    public DbSet<Instrumento> Instrumentos => Set<Instrumento>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(MusicShowDbContext).Assembly);

        modelBuilder.Entity<Instrumento>().HasData(
            new
            {
                Id = 1,
                Codigo = "G-001",
                Nombre = "Guitarra Eléctrica Fender Stratocaster",
                Marca = "Fender",
                Categoria = "guitarras-electricas",
                Precio = 450000m,
                Stock = 5,
                EmojiIcon = "🎸",
                Activo = true,
                EnCatalogo = true,
                UrlImagen = "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f"
            },
            new
            {
                Id = 2,
                Codigo = "B-001",
                Nombre = "Bajo Eléctrico Ibanez GSR200",
                Marca = "Ibanez",
                Categoria = "bajos-electricos",
                Precio = 320000m,
                Stock = 3,
                EmojiIcon = "🎸",
                Activo = true,
                EnCatalogo = true,
                UrlImagen = "https://images.unsplash.com/photo-1550985616-10810253b84d"
            },
            new
            {
                Id = 3,
                Codigo = "BAT-001",
                Nombre = "Batería Acústica Pearl Roadshow",
                Marca = "Pearl",
                Categoria = "baterias-acusticas",
                Precio = 890000m,
                Stock = 2,
                EmojiIcon = "🥁",
                Activo = true,
                EnCatalogo = true,
                UrlImagen = "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7"
            }
        );
    }
}
