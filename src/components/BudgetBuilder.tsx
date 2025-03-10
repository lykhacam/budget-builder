import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./BudgetBuilder.css";

// Danh sách các tháng trong năm
const monthsList = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Định nghĩa kiểu dữ liệu cho danh mục thu nhập/chi tiêu
interface Category {
  id: number;
  name: string;
  values: number[];
  type: "income" | "expense";
}

const BudgetBuilder: React.FC = () => {
  // State lưu trữ tháng bắt đầu và tháng kết thúc
  const [startMonth, setStartMonth] = useState(0);
  const [endMonth, setEndMonth] = useState(11);
  // State lưu trữ danh sách các danh mục
  const [categories, setCategories] = useState<Category[]>([]);
  // State xử lý menu chuột phải
  const [contextMenu, setContextMenu] = useState({
    show: false, x: 0, y: 0, categoryId: -1, colIndex: -1,
  });

  // Cắt danh sách tháng theo khoảng tháng được chọn
  const months = monthsList.slice(startMonth, endMonth + 1);

  // Hàm thêm danh mục mới (thu nhập hoặc chi tiêu)
  const addCategory = (type: "income" | "expense") => {
    setCategories([...categories, { id: Date.now(), name: "", values: Array(months.length).fill(0), type }]);
  };

  // Hàm cập nhật tên danh mục
  const updateCategoryName = (id: number, name: string) => {
    setCategories(prev => prev.map(cat => (cat.id === id ? { ...cat, name } : cat)));
  };

  // Hàm cập nhật giá trị thu nhập/chi tiêu trong một ô
  const updateValue = (id: number, index: number, value: number) => {
    if (value < 0) value = 0; // Giữ giá trị không âm
    setCategories(prev =>
      prev.map(cat =>
        cat.id === id
          ? { ...cat, values: cat.values.map((v, i) => (i === index ? value : v)) }
          : cat
      )
    );
  };

  // Hàm xóa danh mục
  const deleteCategory = (id: number) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  // Xử lý menu chuột phải để hiển thị tùy chọn "Apply to all"
  const handleContextMenu = (e: React.MouseEvent, categoryId: number, colIndex: number) => {
    e.preventDefault();
    setContextMenu({ show: true, x: e.pageX, y: e.pageY, categoryId, colIndex });
  };

  // Hàm áp dụng giá trị của một ô vào tất cả các ô khác trong cùng một danh mục
  const applyToAll = () => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === contextMenu.categoryId
          ? { ...cat, values: cat.values.map(() => cat.values[contextMenu.colIndex]) }
          : cat
      )
    );
    setContextMenu({ show: false, x: 0, y: 0, categoryId: -1, colIndex: -1 });
  };

  // Cập nhật khoảng thời gian hiển thị dữ liệu
  const handleStartMonthChange = (value: number) => {
    setStartMonth(value);
    if (value > endMonth) setEndMonth(value);
    updateCategoryValues(value, endMonth);
  };
  
  const handleEndMonthChange = (value: number) => {
    if (value >= startMonth) {
      setEndMonth(value);
      updateCategoryValues(startMonth, value);
    }
  };
  
  // Tính tổng thu nhập theo từng tháng
  const totalIncome = months.map((_, index) =>
    categories.filter(cat => cat.type === "income").reduce((sum, cat) => sum + cat.values[index], 0)
  );

  // Tính tổng chi tiêu theo từng tháng
  const totalExpense = months.map((_, index) =>
    categories.filter(cat => cat.type === "expense").reduce((sum, cat) => sum + cat.values[index], 0)
  );

  // Cập nhật giá trị danh mục khi thay đổi khoảng tháng
  const updateCategoryValues = (newStart: number, newEnd: number) => {
    const newLength = newEnd - newStart + 1;
  
    setCategories(prev =>
      prev.map(cat => ({
        ...cat,
        values: cat.values.slice(0, newLength).concat(Array(Math.max(0, newLength - cat.values.length)).fill(0)),
      }))
    );
  };
  
  // Tính số dư mỗi tháng dựa trên thu nhập và chi tiêu
  let balance = [0]; 
  for (let i = 0; i < months.length; i++) {
    balance[i + 1] = balance[i] + totalIncome[i] - totalExpense[i];
  }
  balance.pop(); // Loại bỏ giá trị cuối cùng vì không cần thiết

  // Tính tổng số dư cuối cùng
  const lastIndex = months.length - 1;
  const summary = balance[lastIndex] + totalIncome[lastIndex] - totalExpense[lastIndex];

  return (
    <div className="container mt-4">
      <h2 className="mb-3 text-center text-primary">Budget Builder</h2>

      <div className="d-flex mb-3">
        <div className="me-3">
          <label className="form-label">Start Month:</label>
          <select className="form-select" value={startMonth} onChange={e => handleStartMonthChange(Number(e.target.value))}>
            {monthsList.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">End Month:</label>
          <select className="form-select" value={endMonth} onChange={e => handleEndMonthChange(Number(e.target.value))}>
            {monthsList.map((month, index) => (
              <option key={index} value={index} disabled={index < startMonth}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      <table className="table table-bordered table-striped table-hover">
        <thead>
          <tr className="table-dark">
            <th>Category</th>
            {months.map(month => <th key={month}>{month}</th>)}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id} className={cat.type === "income" ? "table-success" : "table-danger"}>
              <td>
                <input type="text" className="form-control" value={cat.name} onChange={e => updateCategoryName(cat.id, e.target.value)} />
              </td>
              {cat.values.map((value, index) => (
                <td key={index} onContextMenu={e => handleContextMenu(e, cat.id, index)}>
                  <input type="number" className="form-control text-center" value={value} min="0" 
                  onChange={e => updateValue(cat.id, index, Number(e.target.value))} />
                </td>
              ))}
              <td>
                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteCategory(cat.id)}>Delete</button>
              </td>
            </tr>
          ))}
          <tr className="fw-bold bg-success text-white">
            <td>Total Income</td>
            {totalIncome.map((val, index) => <td key={index}>{val}</td>)}
            <td></td>
          </tr>
          <tr className="fw-bold bg-danger text-white">
            <td>Total Expense</td>
            {totalExpense.map((val, index) => <td key={index}>{val}</td>)}
            <td></td>
          </tr>
          <tr className="fw-bold bg-primary text-white">
            <td>Balance</td>
            {balance.map((val, index) => <td key={index}>{val}</td>)}
            <td></td>
          </tr>
          <tr className="fw-bold bg-warning text-dark">
            <td>Summary</td>
            <td colSpan={months.length}>{summary}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <button className="btn btn-success me-2" onClick={() => addCategory("income")}>Add Income</button>
      <button className="btn btn-warning" onClick={() => addCategory("expense")}>Add Expense</button>

      {contextMenu.show && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x, position: "absolute", background: "white", border: "1px solid #ccc", padding: "5px", zIndex: 1000 }}>
          <button onClick={applyToAll} className="btn btn-sm btn-primary">Apply to all</button>
        </div>
      )}
    </div>
  );
};

export default BudgetBuilder;



