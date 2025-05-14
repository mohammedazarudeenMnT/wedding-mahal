import React from "react";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Input } from "@/Components/ui/input";
import { Buttons } from "@/Components/ui/button";
import { X, Plus } from "lucide-react";

export default function DamageLossSummary({ damageLossSummary, setDamageLossSummary, categories, subCategories, brands, models }) {
  const handleChange = (index, field, value) => {
    const newRows = [...damageLossSummary];
    newRows[index] = { ...newRows[index], [field]: value };
    setDamageLossSummary(newRows);
  };
  const addRow = () => setDamageLossSummary([...damageLossSummary, {}]);
  const removeRow = (index) => {
    const newRows = [...damageLossSummary];
    newRows.splice(index, 1);
    setDamageLossSummary(newRows);
  };
  const getFilteredSubCategories = (category) => [...new Set(subCategories.filter(sc => sc && category ? true : false))];
  const getFilteredBrands = (category, subCategory) => [...new Set(brands.filter(b => b && category && subCategory ? true : false))];
  const getFilteredModels = (category, subCategory, brand) => [...new Set(models.filter(m => m && category && subCategory && brand ? true : false))];
  return (
    <div>
      <Table aria-label="Damage/Loss Summary table">
        <TableHeader>
          <TableColumn>Category</TableColumn>
          <TableColumn>Sub Category</TableColumn>
          <TableColumn>Brand</TableColumn>
          <TableColumn>Model</TableColumn>
          <TableColumn>Quantity</TableColumn>
          <TableColumn>Condition</TableColumn>
          <TableColumn>Remarks</TableColumn>
          <TableColumn>Amount</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {damageLossSummary.map((row, index) => (
            <TableRow key={index}>
              <TableCell>
                <Select value={row.category} onValueChange={v => handleChange(index, 'category', v)}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select value={row.subCategory} onValueChange={v => handleChange(index, 'subCategory', v)} disabled={!row.category}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select Sub Category" /></SelectTrigger>
                  <SelectContent>{getFilteredSubCategories(row.category).map(sc => <SelectItem key={sc} value={sc}>{sc}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select value={row.brand} onValueChange={v => handleChange(index, 'brand', v)} disabled={!row.category || !row.subCategory}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select Brand" /></SelectTrigger>
                  <SelectContent>{getFilteredBrands(row.category, row.subCategory).map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select value={row.model} onValueChange={v => handleChange(index, 'model', v)} disabled={!row.category || !row.subCategory || !row.brand}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select Model" /></SelectTrigger>
                  <SelectContent>{getFilteredModels(row.category, row.subCategory, row.brand).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input type="number" className="text-xs h-9" min="1" value={row.quantity || ''} onChange={e => handleChange(index, 'quantity', e.target.value)} disabled={!row.category || !row.subCategory || !row.brand || !row.model} />
              </TableCell>
              <TableCell>
                <Select value={row.condition} onValueChange={v => handleChange(index, 'condition', v)}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select Condition" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Broken">Broken</SelectItem>
                    <SelectItem value="Missing">Missing</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input type="text" className="text-xs" placeholder="Remarks" value={row.remarks || ''} onChange={e => handleChange(index, 'remarks', e.target.value)} />
              </TableCell>
              <TableCell>
                <Input type="number" className="text-xs h-9" min="0" value={row.amount || ''} onChange={e => handleChange(index, 'amount', e.target.value)} />
              </TableCell>
              <TableCell>
                <Buttons variant="ghost" size="icon" onClick={() => removeRow(index)} className="h-8 w-8"><X className="h-4 w-4" /></Buttons>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center mt-2">
        <Buttons variant="ghost" size="sm" className="gap-1" onClick={addRow}><Plus className="h-4 w-4" /></Buttons>
      </div>
    </div>
  );
} 