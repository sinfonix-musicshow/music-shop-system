using Microsoft.AspNetCore.Mvc;
using MusicShow.Application.DTOs.Catalogo;
using MusicShow.Application.Interfaces;
using MusicShow.Domain.Exceptions;

namespace MusicShow.Api.Controllers;

/// <summary>
/// Controlador para la gestión y visualización del catálogo comercial de instrumentos.
/// Permite al público consultar los instrumentos exhibidos y al administrador gestionar su publicación.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CatalogoController : ControllerBase
{
    private readonly ICatalogoService _service;

    public CatalogoController(ICatalogoService service)
    {
        _service = service;
    }

    // GET /api/catalogo?categoria=Cuerdas
    /// <summary>
    /// Obtiene todos los instrumentos disponibles en el catálogo comercial, con filtro opcional por categoría.
    /// Solo incluye los instrumentos marcados para catálogo y que se encuentran activos.
    /// Cada ítem muestra nombre, marca, categoría, stock y precio.
    /// </summary>
    /// <param name="categoria">Filtro opcional por categoría (ej. Cuerdas, Percusión, Viento).</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CatalogoItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ObtenerCatalogo([FromQuery] string? categoria)
    {
        var items = await _service.ObtenerCatalogoAsync(categoria);
        return Ok(items);
    }

    // POST /api/catalogo/{id}
    /// <summary>
    /// Agrega un instrumento específico del inventario al catálogo comercial.
    /// </summary>
    /// <param name="id">Identificador del instrumento a publicar.</param>
    [HttpPost("{id:int}")]
    [ProducesResponseType(typeof(CatalogoItemResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AgregarAlCatalogo(int id)
    {
        try
        {
            var resultado = await _service.AgregarAlCatalogoAsync(id);
            return Ok(resultado);
        }
        catch (DomainException ex) when (ex.Message.Contains("encontró"))
        {
            return NotFound(new { mensaje = ex.Message });
        }
        catch (DomainException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    // POST /api/catalogo/lote
    /// <summary>
    /// Agrega una lista de instrumentos al catálogo comercial en una sola operación.
    /// </summary>
    /// <param name="request">Lista con los identificadores de los instrumentos a publicar.</param>
    [HttpPost("lote")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AgregarLote([FromBody] AgregarLoteCatalogoRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            int cantidad = await _service.AgregarLoteAlCatalogoAsync(request);
            return Ok(new
            {
                mensaje = $"Se incorporaron con éxito {cantidad} instrumentos al catálogo comercial.",
                cantidadAgregados = cantidad
            });
        }
        catch (DomainException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    // DELETE /api/catalogo/{id}
    /// <summary>
    /// Quita un instrumento del catálogo comercial.
    /// Nota: El instrumento no se elimina del inventario, solo deja de exhibirse en el catálogo.
    /// </summary>
    /// <param name="id">Identificador del instrumento a retirar del catálogo.</param>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RemoverDelCatalogo(int id)
    {
        try
        {
            await _service.RemoverDelCatalogoAsync(id);
            return NoContent();
        }
        catch (DomainException ex) when (ex.Message.Contains("encontró"))
        {
            return NotFound(new { mensaje = ex.Message });
        }
        catch (DomainException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}
