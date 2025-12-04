import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ExportarRelatorio({ data, columns, filename = "relatorio", title = "Relatório" }) {
  const [loading, setLoading] = useState(false);

  const exportToCSV = () => {
    try {
      if (!data || data.length === 0) {
        toast.error("Nenhum dado para exportar");
        return;
      }

      const headers = columns.map(col => col.label).join(",");
      const rows = data.map(row => 
        columns.map(col => {
          const value = col.accessor ? col.accessor(row) : row[col.key];
          const strValue = String(value ?? "").replace(/"/g, '""');
          return `"${strValue}"`;
        }).join(",")
      );
      
      const csv = [headers, ...rows].join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("CSV exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar CSV");
      console.error(error);
    }
  };

  const exportToExcel = () => {
    try {
      if (!data || data.length === 0) {
        toast.error("Nenhum dado para exportar");
        return;
      }

      // Criar HTML com tabela para Excel
      const headers = columns.map(col => `<th style="background:#922B3E;color:white;padding:8px;border:1px solid #ddd;">${col.label}</th>`).join("");
      const rows = data.map(row => 
        `<tr>${columns.map(col => {
          const value = col.accessor ? col.accessor(row) : row[col.key];
          return `<td style="padding:8px;border:1px solid #ddd;">${value ?? ""}</td>`;
        }).join("")}</tr>`
      ).join("");

      const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="UTF-8"></head>
        <body>
          <h2 style="color:#922B3E;">${title}</h2>
          <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          <table border="1" style="border-collapse:collapse;width:100%;">
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("Excel exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar Excel");
      console.error(error);
    }
  };

  const exportToPDF = async () => {
    setLoading(true);
    try {
      if (!data || data.length === 0) {
        toast.error("Nenhum dado para exportar");
        return;
      }

      // Criar HTML para impressão como PDF
      const headers = columns.map(col => `<th style="background:#922B3E;color:white;padding:10px;border:1px solid #ddd;text-align:left;">${col.label}</th>`).join("");
      const rows = data.map((row, idx) => 
        `<tr style="background:${idx % 2 === 0 ? '#fff' : '#f9f9f9'};">${columns.map(col => {
          const value = col.accessor ? col.accessor(row) : row[col.key];
          return `<td style="padding:10px;border:1px solid #ddd;">${value ?? ""}</td>`;
        }).join("")}</tr>`
      ).join("");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #922B3E; margin-bottom: 5px; }
            .subtitle { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            @media print {
              body { margin: 0; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="subtitle">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          <table>
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin-top:20px;font-size:10px;color:#666;">Sistema Riviera v4.3.0</p>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
      
      toast.success("PDF gerado! Use Ctrl+P para salvar.");
    } catch (error) {
      toast.error("Erro ao gerar PDF");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileDown className="w-4 h-4 mr-2" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="w-4 h-4 mr-2" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}