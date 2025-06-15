import type {
	Expr,
	ExprVisitor,
	BinaryExpr,
	GroupingExpr,
	LiteralExpr,
	UnaryExpr,
} from "src/codegen/Expr";

export class AstPrinter implements ExprVisitor<string> {
	accept(expr: Expr) {
		return expr.accept(this);
	}

	visitBinaryExpr(expr: BinaryExpr): string {
		return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
	}
	visitGroupingExpr(expr: GroupingExpr): string {
		return this.parenthesize("group", expr.expression);
	}
	visitLiteralExpr(expr: LiteralExpr): string {
		if (expr.value === null) return "nil";
		return `${expr.value}`;
	}
	visitUnaryExpr(expr: UnaryExpr): string {
		return this.parenthesize(expr.operator.lexeme, expr.right);
	}

	private parenthesize(name: string, ...exprs: Expr[]) {
		let str = "(" + name;
		for (const expr of exprs) {
			str += " " + expr.accept(this);
		}
		return str + ")";
	}
}
