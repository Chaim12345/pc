import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class FormulaService {
  /**
   * Evaluate a formula for a given item
   * Supports: SUM, AVG, COUNT, MIN, MAX, IF, AND, OR
   */
  static async evaluateFormula(formula: string, itemId: string): Promise<any> {
    try {
      // Parse formula
      const cleanFormula = formula.trim();
      
      // Check formula type
      if (cleanFormula.startsWith('SUM(')) {
        return await this.evaluateSUM(cleanFormula, itemId);
      } else if (cleanFormula.startsWith('AVG(')) {
        return await this.evaluateAVG(cleanFormula, itemId);
      } else if (cleanFormula.startsWith('COUNT(')) {
        return await this.evaluateCOUNT(cleanFormula, itemId);
      } else if (cleanFormula.startsWith('MIN(')) {
        return await this.evaluateMIN(cleanFormula, itemId);
      } else if (cleanFormula.startsWith('MAX(')) {
        return await this.evaluateMAX(cleanFormula, itemId);
      } else if (cleanFormula.startsWith('IF(')) {
        return await this.evaluateIF(cleanFormula, itemId);
      } else {
        // Try to evaluate as expression
        return this.evaluateExpression(cleanFormula, itemId);
      }
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return '#ERROR';
    }
  }

  private static async evaluateSUM(formula: string, itemId: string): Promise<number> {
    const columnName = this.extractParam(formula);
    const values = await this.getColumnValues(columnName, itemId);
    return values.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }

  private static async evaluateAVG(formula: string, itemId: string): Promise<number> {
    const columnName = this.extractParam(formula);
    const values = await this.getColumnValues(columnName, itemId);
    const sum = values.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    return values.length > 0 ? sum / values.length : 0;
  }

  private static async evaluateCOUNT(formula: string, itemId: string): Promise<number> {
    const columnName = this.extractParam(formula);
    const values = await this.getColumnValues(columnName, itemId);
    return values.filter(v => v !== null && v !== undefined && v !== '').length;
  }

  private static async evaluateMIN(formula: string, itemId: string): Promise<number> {
    const columnName = this.extractParam(formula);
    const values = await this.getColumnValues(columnName, itemId);
    const numbers = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
    return numbers.length > 0 ? Math.min(...numbers) : 0;
  }

  private static async evaluateMAX(formula: string, itemId: string): Promise<number> {
    const columnName = this.extractParam(formula);
    const values = await this.getColumnValues(columnName, itemId);
    const numbers = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
    return numbers.length > 0 ? Math.max(...numbers) : 0;
  }

  private static async evaluateIF(formula: string, itemId: string): Promise<any> {
    // IF(condition, trueValue, falseValue)
    const params = this.extractMultipleParams(formula);
    if (params.length !== 3) return '#ERROR';

    const [condition, trueValue, falseValue] = params;
    const conditionResult = await this.evaluateCondition(condition, itemId);

    if (conditionResult) {
      return this.parseValue(trueValue);
    } else {
      return this.parseValue(falseValue);
    }
  }

  private static async evaluateExpression(formula: string, itemId: string): Promise<any> {
    // Replace column references with actual values
    // Example: {Budget} * 0.1
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        columnValues: {
          include: {
            column: true,
          },
        },
      },
    });

    if (!item) return '#ERROR';

    let expression = formula;

    // Replace column references
    const columnMatches = formula.match(/\{([^}]+)\}/g);
    if (columnMatches) {
      for (const match of columnMatches) {
        const columnName = match.slice(1, -1); // Remove {}
        const columnValue = item.columnValues.find(
          cv => cv.column.title.toLowerCase() === columnName.toLowerCase()
        );
        const value = columnValue?.value || 0;
        expression = expression.replace(match, String(value));
      }
    }

    // Safely evaluate expression (basic arithmetic only)
    try {
      // Only allow numbers and basic operators
      if (!/^[\d+\-*/(). ]+$/.test(expression)) {
        return '#ERROR';
      }
      return eval(expression);
    } catch (error) {
      return '#ERROR';
    }
  }

  private static async evaluateCondition(condition: string, itemId: string): Promise<boolean> {
    // Simple conditions: {Column} > 100, {Status} = "Done"
    const operators = ['>=', '<=', '=', '>', '<', '!='];
    let operator = '';
    let parts: string[] = [];

    for (const op of operators) {
      if (condition.includes(op)) {
        operator = op;
        parts = condition.split(op).map(p => p.trim());
        break;
      }
    }

    if (parts.length !== 2) return false;

    const leftValue = await this.getValueOrLiteral(parts[0], itemId);
    const rightValue = this.parseValue(parts[1]);

    switch (operator) {
      case '=':
        return leftValue == rightValue;
      case '!=':
        return leftValue != rightValue;
      case '>':
        return parseFloat(leftValue) > parseFloat(rightValue);
      case '<':
        return parseFloat(leftValue) < parseFloat(rightValue);
      case '>=':
        return parseFloat(leftValue) >= parseFloat(rightValue);
      case '<=':
        return parseFloat(leftValue) <= parseFloat(rightValue);
      default:
        return false;
    }
  }

  private static async getValueOrLiteral(value: string, itemId: string): Promise<any> {
    if (value.startsWith('{') && value.endsWith('}')) {
      // Column reference
      const columnName = value.slice(1, -1);
      const values = await this.getColumnValues(columnName, itemId, true);
      return values[0] || '';
    }
    return this.parseValue(value);
  }

  private static parseValue(value: string): any {
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    // Try to parse as number
    const num = parseFloat(value);
    if (!isNaN(num)) return num;
    return value;
  }

  private static extractParam(formula: string): string {
    const match = formula.match(/\(([^)]+)\)/);
    return match ? match[1].trim() : '';
  }

  private static extractMultipleParams(formula: string): string[] {
    const match = formula.match(/\(([^)]+)\)/);
    if (!match) return [];
    return match[1].split(',').map(p => p.trim());
  }

  private static async getColumnValues(
    columnName: string,
    itemId: string,
    singleItem = false
  ): Promise<any[]> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        board: {
          include: {
            items: {
              include: {
                columnValues: {
                  include: {
                    column: true,
                  },
                },
              },
            },
          },
        },
        columnValues: {
          include: {
            column: true,
          },
        },
      },
    });

    if (!item) return [];

    if (singleItem) {
      // Get value from current item only
      const columnValue = item.columnValues.find(
        cv => cv.column.title.toLowerCase() === columnName.toLowerCase()
      );
      return columnValue ? [columnValue.value] : [];
    }

    // Get values from all items in board
    const values = item.board.items.flatMap(i => {
      const cv = i.columnValues.find(
        cv => cv.column.title.toLowerCase() === columnName.toLowerCase()
      );
      return cv ? [cv.value] : [];
    });

    return values;
  }
}

