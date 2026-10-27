using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MusicShow.Data.Migrations
{
    /// <inheritdoc />
    public partial class AgregarUrlImagen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UrlImagen",
                table: "Instrumentos",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UrlImagen",
                table: "Instrumentos");
        }
    }
}
