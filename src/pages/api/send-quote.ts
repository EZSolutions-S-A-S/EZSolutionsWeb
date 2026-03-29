import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

interface QuoteFormData {
  name: string;
  email: string;
  phone: string;
  company?: string;
  project_type: string;
  description: string;
  budget?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bodyText = await request.text();

    if (!bodyText) {
      return new Response(
        JSON.stringify({ error: 'Body vacío - no se recibieron datos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let data: QuoteFormData;
    try {
      data = JSON.parse(bodyText);
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'JSON inválido', details: parseError instanceof Error ? parseError.message : 'Error desconocido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data.name || !data.email || !data.phone || !data.project_type || !data.description) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const companyEmail = import.meta.env.RESEND_QUOTE_EMAIL || 'ezsolutionssas@example.com';
    const senderEmail = import.meta.env.RESEND_FROM_EMAIL || 'contacto@ezsolutionssas.online';

    const emailContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1f2937; }
          .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .header { background: linear-gradient(135deg, #1e73be 0%, #005DAA 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 40px 20px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 16px; font-weight: 700; color: #005DAA; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-row { display: flex; margin-bottom: 12px; }
          .info-label { font-weight: 600; color: #1f2937; min-width: 120px; }
          .info-value { color: #6b7280; word-break: break-word; }
          .description-box { background: #f9fafb; border-left: 4px solid #005DAA; padding: 15px; border-radius: 4px; color: #4b5563; font-size: 14px; line-height: 1.6; }
          .footer { background: #f3f4f6; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer-text { font-size: 12px; color: #6b7280; margin: 0; }
          .highlight { color: #005DAA; font-weight: 600; }
          .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>Nueva Solicitud de Cotización</h1>
            <p>Tienes una nueva solicitud de un cliente potencial</p>
          </div>

          <div class="content">
            <div class="section">
              <div class="section-title">Información del Cliente</div>
              <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span class="info-value"><strong>${data.name}</strong></span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value"><a href="mailto:${data.email}" style="color: #005DAA; text-decoration: none;">${data.email}</a></span>
              </div>
              <div class="info-row">
                <span class="info-label">Teléfono:</span>
                <span class="info-value"><a href="tel:${data.phone}" style="color: #005DAA; text-decoration: none;">${data.phone}</a></span>
              </div>
              ${data.company ? `<div class="info-row">
                <span class="info-label">Empresa:</span>
                <span class="info-value">${data.company}</span>
              </div>` : ''}
            </div>

            <div class="divider"></div>

            <div class="section">
              <div class="section-title">Detalles del Proyecto</div>
              <div class="info-row">
                <span class="info-label">Tipo:</span>
                <span class="info-value"><span class="highlight">${data.project_type}</span></span>
              </div>
              ${data.budget ? `<div class="info-row">
                <span class="info-label">Presupuesto:</span>
                <span class="info-value"><strong>${data.budget}</strong></span>
              </div>` : ''}
            </div>

            <div class="section">
              <div class="section-title">Descripción</div>
              <div class="description-box">
                ${data.description.replace(/\n/g, '<br>')}
              </div>
            </div>

            <div class="divider"></div>

            <div style="background: #f0f8ff; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 13px; color: #005DAA; font-weight: 600;">
                Responde directamente a este email para ponerte en contacto con el cliente
              </p>
            </div>
          </div>

          <div class="footer">
            <p class="footer-text">© 2026 EZ Solutions. Todos los derechos reservados.</p>
            <p class="footer-text" style="margin-top: 8px;">Este es un email automático generado desde tu formulario de cotización.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await resend.emails.send({
      from: senderEmail,
      to: companyEmail,
      subject: `Nueva Cotización - ${data.name}`,
      html: emailContent,
      replyTo: data.email,
    });

    if (response.error) {
      return new Response(
        JSON.stringify({ error: 'No se pudo enviar el email', details: response.error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cotización enviada correctamente',
        emailId: response.data?.id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
