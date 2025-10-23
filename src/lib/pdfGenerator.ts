import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface PDFReportData {
  title: string;
  data: any;
  type: "geral" | "protocolos" | "agendamentos";
}

export const generatePDFReport = async ({ title, data, type }: PDFReportData) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let currentY = margin;

  // Header
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text(title, margin, currentY);
  currentY += 10;

  // Timestamp
  const now = new Date();
  const timestamp = `${now.toLocaleDateString("pt-BR")} ${now.toLocaleTimeString("pt-BR")}`;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Gerado em: ${timestamp}`, margin, currentY);
  currentY += 15;

  // Content based on type
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");

  if (type === "geral") {
    // Statistics section
    pdf.setFont("helvetica", "bold");
    pdf.text("Estatísticas Gerais", margin, currentY);
    currentY += 8;
    pdf.setFont("helvetica", "normal");

    const stats = [
      { label: "Total de Usuários Cadastrados", value: data.totalUsers },
      { label: "Secretarias Ativas", value: data.totalSecretarias },
      { label: "Total de Protocolos", value: data.totalProtocols },
      { label: "Protocolos Abertos", value: data.protocolsOpen },
      { label: "Protocolos Encerrados", value: data.protocolsClosed },
      { label: "Total de Agendamentos", value: data.totalAppointments },
      { label: "Agendamentos Pendentes", value: data.appointmentsPending },
      { label: "Notícias Publicadas", value: data.totalNews },
      { label: "Eventos Cadastrados", value: data.totalEvents },
      {
        label: "Taxa de Resolução de Protocolos",
        value: `${Math.round(((data.protocolsClosed || 0) / (data.totalProtocols || 1)) * 100)}%`,
      },
    ];

    stats.forEach((stat) => {
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = margin;
      }
      pdf.text(`${stat.label}: ${stat.value}`, margin, currentY);
      currentY += 7;
    });

    // Performance indicators
    currentY += 5;
    pdf.setFont("helvetica", "bold");
    pdf.text("Indicadores de Desempenho", margin, currentY);
    currentY += 8;
    pdf.setFont("helvetica", "normal");

    const indicators = [
      {
        label: "Eficiência no Atendimento",
        value: `${Math.round((data.protocolsClosed / data.totalProtocols) * 100) || 0}%`,
      },
      {
        label: "Demanda de Agendamentos",
        value: `${data.appointmentsPending} pendentes de ${data.totalAppointments} totais`,
      },
      {
        label: "Engajamento do Portal",
        value: `${data.totalNews} notícias e ${data.totalEvents} eventos`,
      },
    ];

    indicators.forEach((indicator) => {
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = margin;
      }
      pdf.text(`${indicator.label}: ${indicator.value}`, margin, currentY);
      currentY += 7;
    });
  }

  // Footer with detailed timestamp
  const addFooter = (pageNum: number) => {
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "italic");
    const footerText = `Gerado em: ${now.toLocaleDateString("pt-BR")} às ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")} - Página ${pageNum}`;
    pdf.text(footerText, margin, pageHeight - 10);
  };

  // Add footer to all pages
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(i);
  }

  // Save PDF
  const fileName = `relatorio_${type}_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}.pdf`;
  pdf.save(fileName);
};
