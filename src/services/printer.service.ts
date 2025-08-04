import { logger } from '../utils/logger';
import { i18n } from '../utils/i18n';

interface PrinterConfig {
  name: string;
  type: 'receipt' | 'kitchen' | 'label';
  ipAddress?: string;
  port?: number;
  isDefault: boolean;
}

interface PrintJob {
  id: string;
  type: 'receipt' | 'order' | 'report';
  data: any;
  printer?: string;
  copies: number;
  timestamp: Date;
}

class PrinterService {
  private printers: Map<string, PrinterConfig> = new Map();
  private printQueue: PrintJob[] = [];
  private isProcessing = false;

  constructor() {
    this.initializePrinters();
  }

  private initializePrinters(): void {
    // In a real implementation, this would detect available printers
    // For now, we'll use browser printing and ESC/POS for network printers
    
    if (typeof window !== 'undefined' && 'print' in window) {
      this.addPrinter({
        name: 'Browser Print',
        type: 'receipt',
        isDefault: true
      });
    }

    // Check for network printer configuration
    const savedPrinters = localStorage.getItem('printer_config');
    if (savedPrinters) {
      try {
        const configs = JSON.parse(savedPrinters);
        configs.forEach((config: PrinterConfig) => this.addPrinter(config));
      } catch (error) {
        logger.error('PrinterService', 'Failed to load printer configurations', error);
      }
    }
  }

  addPrinter(config: PrinterConfig): void {
    this.printers.set(config.name, config);
    logger.info('PrinterService', 'Printer added', config);
  }

  removePrinter(name: string): void {
    this.printers.delete(name);
  }

  getPrinters(): PrinterConfig[] {
    return Array.from(this.printers.values());
  }

  getDefaultPrinter(): PrinterConfig | undefined {
    return Array.from(this.printers.values()).find(p => p.isDefault);
  }

  /**
   * Print a receipt
   */
  async printReceipt(order: any, printer?: string): Promise<void> {
    const printJob: PrintJob = {
      id: Date.now().toString(),
      type: 'receipt',
      data: order,
      printer: printer || this.getDefaultPrinter()?.name,
      copies: 1,
      timestamp: new Date()
    };

    return this.processPrintJob(printJob);
  }

  /**
   * Print kitchen order
   */
  async printKitchenOrder(order: any, printer?: string): Promise<void> {
    const printJob: PrintJob = {
      id: Date.now().toString(),
      type: 'order',
      data: order,
      printer: printer || 'kitchen',
      copies: 1,
      timestamp: new Date()
    };

    return this.processPrintJob(printJob);
  }

  /**
   * Process print job
   */
  private async processPrintJob(job: PrintJob): Promise<void> {
    this.printQueue.push(job);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.printQueue.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.printQueue.length > 0) {
      const job = this.printQueue.shift();
      if (job) {
        try {
          await this.executePrintJob(job);
          logger.info('Printer', 'Print job completed', { id: job.id });
        } catch (error) {
          logger.error('Printer', 'Print job failed', { id: job.id, error });
        }
      }
    }

    this.isProcessing = false;
  }

  private async executePrintJob(job: PrintJob): Promise<void> {
    const printer = job.printer ? this.printers.get(job.printer) : this.getDefaultPrinter();
    
    if (!printer) {
      throw new Error('No printer available');
    }

    switch (printer.type) {
      case 'receipt':
        if (printer.name === 'Browser Print') {
          await this.printToBrowser(job);
        } else if (printer.ipAddress) {
          await this.printToNetworkPrinter(job, printer);
        }
        break;
      
      case 'kitchen':
        await this.printToKitchenPrinter(job, printer);
        break;
      
      case 'label':
        await this.printToLabelPrinter(job, printer);
        break;
    }
  }

  /**
   * Browser printing
   */
  private async printToBrowser(job: PrintJob): Promise<void> {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }

    const html = this.generateReceiptHTML(job.data);
    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      setTimeout(() => printWindow.close(), 1000);
    };
  }

  /**
   * Network printer (ESC/POS)
   */
  private async printToNetworkPrinter(job: PrintJob, printer: PrinterConfig): Promise<void> {
    const commands = this.generateESCPOSCommands(job.data);
    
    // Send to printer via WebSocket or HTTP endpoint
    try {
      const response = await fetch(`http://${printer.ipAddress}:${printer.port}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: commands
      });

      if (!response.ok) {
        throw new Error(`Printer responded with ${response.status}`);
      }
    } catch (error) {
      logger.error('PrinterService', 'Network printer error', error);
      // Fallback to browser printing
      await this.printToBrowser(job);
    }
  }

  /**
   * Kitchen printer formatting
   */
  private async printToKitchenPrinter(job: PrintJob, printer: PrinterConfig): Promise<void> {
    // Kitchen printers usually need different formatting
    const commands = this.generateKitchenPrintCommands(job.data);
    
    if (printer.ipAddress) {
      await this.sendToNetworkPrinter(commands, printer);
    } else {
      await this.printToBrowser(job);
    }
  }

  /**
   * Label printer
   */
  private async printToLabelPrinter(job: PrintJob, printer: PrinterConfig): Promise<void> {
    // Label printers (like Zebra) use different command languages
    const commands = this.generateLabelCommands(job.data);
    
    if (printer.ipAddress) {
      await this.sendToNetworkPrinter(commands, printer);
    }
  }

  /**
   * Generate receipt HTML
   */
  private generateReceiptHTML(order: any): string {
    const { formatCurrency, formatDate, t } = i18n;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: 80mm 297mm; margin: 0; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            margin: 10px;
            width: 280px;
          }
          .header { text-align: center; margin-bottom: 10px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-weight: bold; font-size: 14px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${order.restaurantName || 'GRIT Restaurant'}</h2>
          <p>${order.restaurantAddress || ''}</p>
          <p>Tel: ${order.restaurantPhone || ''}</p>
        </div>
        
        <div class="divider"></div>
        
        <div>
          <p>Order #: ${order.orderNumber}</p>
          <p>Table: ${order.tableNumber}</p>
          <p>Date: ${formatDate(order.createdAt)}</p>
          <p>Waiter: ${order.waiterName || 'N/A'}</p>
        </div>
        
        <div class="divider"></div>
        
        <div>
          ${order.items.map((item: any) => `
            <div class="item">
              <span>${item.quantity}x ${item.name}</span>
              <span>${formatCurrency(item.price * item.quantity)}</span>
            </div>
            ${item.customizations ? `<div style="margin-left: 20px; font-size: 10px;">${item.customizations}</div>` : ''}
          `).join('')}
        </div>
        
        <div class="divider"></div>
        
        <div>
          <div class="item">
            <span>Subtotal:</span>
            <span>${formatCurrency(order.subtotal)}</span>
          </div>
          ${order.tax ? `
            <div class="item">
              <span>Tax:</span>
              <span>${formatCurrency(order.tax)}</span>
            </div>
          ` : ''}
          ${order.discount ? `
            <div class="item">
              <span>Discount:</span>
              <span>-${formatCurrency(order.discount)}</span>
            </div>
          ` : ''}
          <div class="divider"></div>
          <div class="item total">
            <span>TOTAL:</span>
            <span>${formatCurrency(order.total)}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for dining with us!</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate ESC/POS commands for thermal printers
   */
  private generateESCPOSCommands(order: any): Uint8Array {
    const encoder = new TextEncoder();
    const commands: number[] = [];
    
    // Initialize printer
    commands.push(0x1B, 0x40); // ESC @
    
    // Center alignment
    commands.push(0x1B, 0x61, 0x01); // ESC a 1
    
    // Restaurant name (double height)
    commands.push(0x1B, 0x21, 0x10); // ESC ! n
    commands.push(...Array.from(encoder.encode(order.restaurantName + '\n')));
    
    // Normal text
    commands.push(0x1B, 0x21, 0x00);
    
    // Add order details
    commands.push(...Array.from(encoder.encode(`Order #: ${order.orderNumber}\n`)));
    commands.push(...Array.from(encoder.encode(`Table: ${order.tableNumber}\n`)));
    
    // Cut paper
    commands.push(0x1D, 0x56, 0x00); // GS V 0
    
    return new Uint8Array(commands);
  }

  /**
   * Generate kitchen print commands
   */
  private generateKitchenPrintCommands(order: any): Uint8Array {
    // Kitchen printers need different formatting - larger text, no prices
    const encoder = new TextEncoder();
    const commands: number[] = [];
    
    // Large text for order number
    commands.push(0x1B, 0x21, 0x30); // ESC ! 48 (double width + double height)
    commands.push(...Array.from(encoder.encode(`ORDER ${order.orderNumber}\n`)));
    
    // Table number
    commands.push(...Array.from(encoder.encode(`TABLE ${order.tableNumber}\n\n`)));
    
    // Normal text for items
    commands.push(0x1B, 0x21, 0x00);
    
    order.items.forEach((item: any) => {
      commands.push(...Array.from(encoder.encode(`${item.quantity}x ${item.name}\n`)));
      if (item.notes) {
        commands.push(...Array.from(encoder.encode(`   Note: ${item.notes}\n`)));
      }
    });
    
    // Cut
    commands.push(0x1D, 0x56, 0x00);
    
    return new Uint8Array(commands);
  }

  /**
   * Generate label commands (ZPL for Zebra printers)
   */
  private generateLabelCommands(data: any): string {
    return `
      ^XA
      ^FO50,50^ADN,36,20^FDTable ${data.tableNumber}^FS
      ^FO50,100^ADN,24,12^FDOrder ${data.orderNumber}^FS
      ^FO50,150^ADN,18,10^FD${new Date().toLocaleString()}^FS
      ^XZ
    `;
  }

  /**
   * Send commands to network printer
   */
  private async sendToNetworkPrinter(commands: Uint8Array | string, printer: PrinterConfig): Promise<void> {
    const body = commands instanceof Uint8Array ? commands : new TextEncoder().encode(commands);
    
    const response = await fetch(`http://${printer.ipAddress}:${printer.port}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: body
    });

    if (!response.ok) {
      throw new Error(`Printer error: ${response.statusText}`);
    }
  }
}

// Export singleton
export const printerService = new PrinterService();