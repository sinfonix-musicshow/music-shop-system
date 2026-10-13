using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MusicShow.Domain.Entities;

namespace MusicShow.Data.Configurations;

/// <summary>
/// Configuración de mapeo de la entidad DetalleFactura para EF Core (Fluent API).
/// </summary>
public class DetalleFacturaConfiguration : IEntityTypeConfiguration<DetalleFactura>
{
    public void Configure(EntityTypeBuilder<DetalleFactura> builder)
    {
        builder.ToTable("DetallesFactura");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.CodigoInstrumento)
               .IsRequired()
               .HasMaxLength(50);

        builder.Property(d => d.NombreInstrumento)
               .IsRequired()
               .HasMaxLength(200);

        builder.Property(d => d.Cantidad)
               .IsRequired();

        builder.Property(d => d.PrecioUnitario)
               .IsRequired()
               .HasColumnType("decimal(18,2)");

        builder.Property(d => d.Subtotal)
               .IsRequired()
               .HasColumnType("decimal(18,2)");

        // Relación hacia Instrumento — sin cascada (restricción para preservar historial)
        builder.HasOne(d => d.Instrumento)
               .WithMany()
               .HasForeignKey(d => d.InstrumentoId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}

