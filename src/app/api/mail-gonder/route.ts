import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const { email, subject, text, pdfDataUrl, sirketAdi } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'E-posta adresi gereklidir.' }, { status: 400 });
    }

    if (!resend) {
      console.warn("RESEND_API_KEY bulunamadı, e-posta gönderimi simüle edildi.");
      return NextResponse.json({ success: true, simulated: true, message: 'API key eksik, gönderim simüle edildi.' });
    }

    // PDF datasını Buffer'a çevirme
    let pdfBuffer: Buffer | null = null;
    if (pdfDataUrl && pdfDataUrl.includes('base64,')) {
      const base64Data = pdfDataUrl.split('base64,')[1];
      pdfBuffer = Buffer.from(base64Data, 'base64');
    }

    const attachments = pdfBuffer ? [{
      filename: `${sirketAdi ? sirketAdi.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'atalitix'}_erp_analiz_raporu.pdf`,
      content: pdfBuffer,
    }] : [];

    const { data, error } = await resend.emails.send({
      from: 'Atalitix Portal <onboarding@resend.dev>', // Canlıya çıkarken kendi domaininizi (örn: info@atalitix.com) yazacaksınız.
      to: [email],
      subject: subject || 'ATAlitiX ERP Analiz Sonuçlarınız',
      html: `
        <div style="font-family: sans-serif; max-w-md: 600px; margin: 0 auto; color: #334155;">
          <h2>Sayın İlgili,</h2>
          <p>ATAlitiX ERP Uygunluk Değerlendirmesi sonucunuz başarıyla oluşturulmuştur.</p>
          <p>Sonuçlarınızı içeren detaylı analiz raporunu bu e-postanın ekindeki <strong>PDF</strong> dosyasında bulabilirsiniz.</p>
          <br/>
          <p>Çıkan sonuçlarla ilgili uzman görüşü almak veya sorularınızı yöneltmek için bizimle iletişime geçebilirsiniz.</p>
          <br/>
          <p>Teşekkürler,</p>
          <p><strong>ATAlitiX Danışmanlık Ekibi</strong></p>
        </div>
      `,
      attachments,
    });

    if (error) {
      console.error('Resend API Hatası:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Mail gönderme hatası:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
