using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MusicShow.Data.Migrations
{
    /// <inheritdoc />
    public partial class RecrearBaseConSemilla : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Instrumentos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Codigo = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Nombre = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Marca = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Categoria = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Stock = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    Precio = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    EmojiIcon = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true),
                    Activo = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    EnCatalogo = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    UrlImagen = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Instrumentos", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Instrumentos",
                columns: new[] { "Id", "Activo", "Categoria", "Codigo", "EmojiIcon", "EnCatalogo", "Marca", "Nombre", "Precio", "Stock", "UrlImagen" },
                values: new object[,]
                {
                    { 1, true, "guitarras-electricas", "G-001", "🎸", true, "Fender", "Guitarra Eléctrica Fender Stratocaster", 450000m, 5, "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f" },
                    { 2, true, "bajos-electricos", "B-001", "🎸", true, "Ibanez", "Bajo Eléctrico Ibanez GSR200", 320000m, 3, "https://images.unsplash.com/photo-1550985616-10810253b84d" },
                    { 3, true, "baterias-acusticas", "BAT-001", "🥁", true, "Pearl", "Batería Acústica Pearl Roadshow", 890000m, 2, "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Instrumentos_Codigo",
                table: "Instrumentos",
                column: "Codigo",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Instrumentos");
        }
    }
}
