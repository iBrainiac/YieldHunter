import { MailService } from '@sendgrid/mail';

// Initialize SendGrid
const sendgrid = new MailService();

// Check if SendGrid API key is available
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sendgrid.setApiKey(apiKey);
  console.log('SendGrid initialized successfully');
} else {
  console.warn('SENDGRID_API_KEY is not set. Email notifications will not be sent.');
}

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send an email notification using SendGrid
 * @param options Email parameters
 * @returns Promise that resolves to boolean indicating success
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!apiKey) {
    console.warn('Cannot send email: SENDGRID_API_KEY is not set');
    return false;
  }

  try {
    const message = {
      to: options.to,
      from: 'noreply@yieldoptimizer.ai', // Use your registered SendGrid email
      subject: options.subject,
      text: options.text,
      html: options.html || `<p>${options.text}</p>`,
    };

    await sendgrid.send(message);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a yield opportunity notification
 * @param email Recipient email
 * @param opportunityDetails Details about the yield opportunity
 * @returns Promise that resolves to boolean indicating success
 */
export async function sendYieldOpportunityNotification(
  email: string,
  opportunityDetails: {
    strategyName: string;
    asset: string;
    protocol: string;
    network: string;
    apy: number;
    transactionHash: string;
  }
): Promise<boolean> {
  const { strategyName, asset, protocol, network, apy, transactionHash } = opportunityDetails;
  
  const subject = `Yield Strategy Executed: ${strategyName}`;
  
  const text = `
    Your yield strategy "${strategyName}" has been executed successfully.
    
    Details:
    - Asset: ${asset}
    - Protocol: ${protocol}
    - Network: ${network}
    - APY: ${apy}%
    - Transaction Hash: ${transactionHash}
    
    Log in to your dashboard to see more details.
  `;
  
  const html = `
    <h2>Yield Strategy Executed</h2>
    <p>Your yield strategy <strong>${strategyName}</strong> has been executed successfully.</p>
    
    <h3>Details:</h3>
    <ul>
      <li><strong>Asset:</strong> ${asset}</li>
      <li><strong>Protocol:</strong> ${protocol}</li>
      <li><strong>Network:</strong> ${network}</li>
      <li><strong>APY:</strong> ${apy}%</li>
      <li><strong>Transaction Hash:</strong> <code>${transactionHash}</code></li>
    </ul>
    
    <p><a href="https://app.yieldoptimizer.ai/dashboard">Log in to your dashboard</a> to see more details.</p>
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}