import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import ExcelJS from 'exceljs';
import { createObjectCsvWriter } from 'csv-writer';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export const importExportController = {
  // Export board to Excel
  async exportToExcel(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: {
          groups: {
            include: {
              items: {
                include: {
                  columnValues: true
                }
              }
            }
          },
          columns: true
        }
      });

      if (!board) {
        return res.status(404).json({ success: false, error: 'Board not found' });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(board.name);

      // Add headers
      const headers = ['Group', 'Item Name', ...board.columns.map(col => col.title)];
      worksheet.addRow(headers);

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4A90E2' }
      };

      // Add data
      board.groups.forEach(group => {
        group.items.forEach(item => {
          const row = [
            group.title,
            item.name,
            ...board.columns.map(col => {
              const colValue = item.columnValues.find(cv => cv.columnId === col.id);
              return colValue ? colValue.value : '';
            })
          ];
          worksheet.addRow(row);
        });
      });

      // Auto-fit columns
      worksheet.columns.forEach((column, index) => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });

      // Set response headers
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${board.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      console.error('Export to Excel error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Export board to CSV
  async exportToCSV(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: {
          groups: {
            include: {
              items: {
                include: {
                  columnValues: true
                }
              }
            }
          },
          columns: true
        }
      });

      if (!board) {
        return res.status(404).json({ success: false, error: 'Board not found' });
      }

      // Build CSV data
      const headers = ['Group', 'Item Name', ...board.columns.map(col => col.title)];
      const rows: any[] = [];

      board.groups.forEach(group => {
        group.items.forEach(item => {
          const row: any = {
            Group: group.title,
            'Item Name': item.name
          };
          board.columns.forEach(col => {
            const colValue = item.columnValues.find(cv => cv.columnId === col.id);
            row[col.title] = colValue ? colValue.value : '';
          });
          rows.push(row);
        });
      });

      // Convert to CSV
      const csvLines = [
        headers.join(','),
        ...rows.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma
            const escaped = value.toString().replace(/"/g, '""');
            return escaped.includes(',') ? `"${escaped}"` : escaped;
          }).join(',')
        )
      ];

      const csvContent = csvLines.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${board.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.csv`
      );

      res.send(csvContent);
    } catch (error: any) {
      console.error('Export to CSV error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Export board to PDF
  async exportToPDF(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: {
          groups: {
            include: {
              items: {
                include: {
                  columnValues: true
                }
              }
            }
          },
          columns: true
        }
      });

      if (!board) {
        return res.status(404).json({ success: false, error: 'Board not found' });
      }

      const doc = new PDFDocument({ margin: 50 });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${board.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`
      );

      doc.pipe(res);

      // Title
      doc.fontSize(24).text(board.name, { align: 'center' });
      doc.moveDown();

      if (board.description) {
        doc.fontSize(12).text(board.description, { align: 'center' });
        doc.moveDown();
      }

      doc.fontSize(10).text(`Exported: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      // Groups and Items
      board.groups.forEach((group, groupIndex) => {
        if (groupIndex > 0) doc.moveDown();

        doc.fontSize(14).fillColor('#4A90E2').text(group.title);
        doc.moveDown(0.5);

        group.items.forEach(item => {
          doc.fontSize(11).fillColor('#000000').text(`• ${item.name}`);
          
          // Column values
          const valueTexts: string[] = [];
          board.columns.forEach(col => {
            const colValue = item.columnValues.find(cv => cv.columnId === col.id);
            if (colValue && colValue.value) {
              valueTexts.push(`${col.title}: ${colValue.value}`);
            }
          });

          if (valueTexts.length > 0) {
            doc.fontSize(9).fillColor('#666666').text(`  ${valueTexts.join(' | ')}`, {
              indent: 20
            });
          }

          doc.moveDown(0.5);
        });
      });

      doc.end();
    } catch (error: any) {
      console.error('Export to PDF error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Download template
  async downloadTemplate(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;

      const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: {
          columns: true
        }
      });

      if (!board) {
        return res.status(404).json({ success: false, error: 'Board not found' });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Template');

      // Add headers
      const headers = ['Group', 'Item Name', ...board.columns.map(col => col.title)];
      worksheet.addRow(headers);

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4A90E2' }
      };

      // Add sample row
      const sampleRow = ['Sample Group', 'Sample Item', ...board.columns.map(() => 'Sample Value')];
      worksheet.addRow(sampleRow);

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 20;
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${board.name.replace(/[^a-z0-9]/gi, '_')}_template.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      console.error('Download template error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Import from Excel/CSV
  async importData(req: AuthRequest, res: Response) {
    try {
      const { boardId } = req.params;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: {
          groups: true,
          columns: true
        }
      });

      if (!board) {
        return res.status(404).json({ success: false, error: 'Board not found' });
      }

      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();

      let rows: any[] = [];

      // Parse based on file type
      if (fileExt === '.xlsx' || fileExt === '.xls') {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0];

        const headers: string[] = [];
        worksheet.getRow(1).eachCell((cell) => {
          headers.push(cell.value?.toString() || '');
        });

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header

          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            rowData[headers[colNumber - 1]] = cell.value;
          });
          rows.push(rowData);
        });
      } else if (fileExt === '.csv') {
        const csvContent = fs.readFileSync(filePath, 'utf-8');
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(',');
          const rowData: any = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index]?.trim() || '';
          });
          rows.push(rowData);
        }
      }

      // Import data
      let created = 0;
      const errors: string[] = [];

      for (const row of rows) {
        try {
          let groupName = row['Group'] || board.groups[0]?.title;
          let group = board.groups.find(g => g.title === groupName);

          if (!group && groupName) {
            // Create group if doesn't exist
            group = await prisma.group.create({
              data: {
                boardId,
                title: groupName,
                position: board.groups.length
              }
            });
          }

          if (!group) {
            errors.push(`No group found for row: ${JSON.stringify(row)}`);
            continue;
          }

          // Create item
          const item = await prisma.item.create({
            data: {
              boardId: boardId,
              groupId: group.id,
              name: row['Item Name'] || 'Untitled',
              position: 0
            }
          });

          // Create column values
          for (const col of board.columns) {
            const value = row[col.title];
            if (value) {
              await prisma.columnValue.create({
                data: {
                  itemId: item.id,
                  columnId: col.id,
                  value: value.toString()
                }
              });
            }
          }

          created++;
        } catch (error: any) {
          errors.push(`Error importing row: ${error.message}`);
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        data: {
          imported: created,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    } catch (error: any) {
      console.error('Import data error:', error);
      
      // Clean up file on error
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      res.status(500).json({ success: false, error: error.message });
    }
  }
};





