using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MusicShow.Domain.Entities;

namespace MusicShow.Data.Configurations;

/// <summary>
/// Configuración de mapeo de la entidad Instrumento para EF Core.
/// </summary>
public class InstrumentoConfiguration : IEntityTypeConfiguration<Instrumento>
{
    public void Configure(EntityTypeBuilder<Instrumento> builder)
    {
        builder.ToTable("Instrumentos");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Codigo)
               .IsRequired()
               .HasMaxLength(50);

        builder.HasIndex(i => i.Codigo)
               .IsUnique();

        builder.Property(i => i.Nombre)
               .IsRequired()
               .HasMaxLength(200);

        builder.Property(i => i.Marca)
               .IsRequired()
               .HasMaxLength(100);

        builder.Property(i => i.Categoria)
               .IsRequired()
               .HasMaxLength(100);

        builder.Property(i => i.Stock)
               .IsRequired()
               .HasDefaultValue(0);

        builder.Property(i => i.Precio)
               .IsRequired()
               .HasColumnType("decimal(18,2)");

        builder.Property(i => i.EmojiIcon)
               .HasMaxLength(10);

        builder.Property(i => i.Activo)
               .IsRequired()
               .HasDefaultValue(true);

        builder.Property(i => i.EnCatalogo)
               .IsRequired()
               .HasDefaultValue(false);
    }
}

