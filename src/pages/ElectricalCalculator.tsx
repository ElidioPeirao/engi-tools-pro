
import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const ElectricalCalculator = () => {
  const [calcType, setCalcType] = useState("ohmslaw");
  const [value1, setValue1] = useState("");
  const [value2, setValue2] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [formula, setFormula] = useState("");

  const calculate = () => {
    const num1 = parseFloat(value1);
    const num2 = parseFloat(value2);
    
    if (isNaN(num1) || isNaN(num2)) {
      setResult(null);
      setFormula("");
      return;
    }

    let calculatedResult = 0;
    let usedFormula = "";
    
    switch (calcType) {
      case "ohmslaw":
        // V = I * R
        calculatedResult = num1 * num2;
        usedFormula = "V = I × R";
        break;
      case "power":
        // P = I * V
        calculatedResult = num1 * num2;
        usedFormula = "P = I × V";
        break;
      case "resistance":
        // R = ρ * L / A
        calculatedResult = num1 * num2;
        usedFormula = "R = ρ × L / A";
        break;
      default:
        calculatedResult = 0;
        usedFormula = "";
    }
    
    setResult(calculatedResult);
    setFormula(usedFormula);
  };

  const getResultUnit = () => {
    switch (calcType) {
      case "ohmslaw":
        return "V";
      case "power":
        return "W";
      case "resistance":
        return "Ω";
      default:
        return "";
    }
  };

  return (
    <Layout title="Calculadora Elétrica">
      <div className="max-w-3xl mx-auto">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <Tabs defaultValue="ohmslaw" onValueChange={setCalcType} className="w-full">
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="ohmslaw">Lei de Ohm</TabsTrigger>
                <TabsTrigger value="power">Potência</TabsTrigger>
                <TabsTrigger value="resistance">Resistência</TabsTrigger>
              </TabsList>
              
              <TabsContent value="ohmslaw" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current">Corrente (I) em Amperes</Label>
                  <Input
                    id="current"
                    type="number"
                    placeholder="Insira a corrente"
                    value={value1}
                    onChange={(e) => setValue1(e.target.value)}
                    className="bg-black/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="resistance">Resistência (R) em Ohms</Label>
                  <Input
                    id="resistance"
                    type="number"
                    placeholder="Insira a resistência"
                    value={value2}
                    onChange={(e) => setValue2(e.target.value)}
                    className="bg-black/50"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="power" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-power">Corrente (I) em Amperes</Label>
                  <Input
                    id="current-power"
                    type="number"
                    placeholder="Insira a corrente"
                    value={value1}
                    onChange={(e) => setValue1(e.target.value)}
                    className="bg-black/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="voltage">Tensão (V) em Volts</Label>
                  <Input
                    id="voltage"
                    type="number"
                    placeholder="Insira a tensão"
                    value={value2}
                    onChange={(e) => setValue2(e.target.value)}
                    className="bg-black/50"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="resistance" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resistivity">Resistividade (ρ) em Ohm·m</Label>
                  <Input
                    id="resistivity"
                    type="number"
                    placeholder="Insira a resistividade"
                    value={value1}
                    onChange={(e) => setValue1(e.target.value)}
                    className="bg-black/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="length-area">Comprimento (L) / Área (A)</Label>
                  <Input
                    id="length-area"
                    type="number"
                    placeholder="Insira o valor de L/A"
                    value={value2}
                    onChange={(e) => setValue2(e.target.value)}
                    className="bg-black/50"
                  />
                </div>
              </TabsContent>
              
              <Button 
                onClick={calculate}
                className="w-full mt-6 bg-orange-500 hover:bg-orange-600"
              >
                Calcular
              </Button>
              
              {result !== null && (
                <div className="mt-8 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30 space-y-2">
                  <p className="text-center text-sm text-orange-300/70">
                    {formula}
                  </p>
                  <p className="text-center">
                    <span className="text-lg">Resultado: </span>
                    <span className="text-2xl font-bold text-orange-400">{result.toFixed(4)}</span>
                    <span className="ml-2 text-orange-300">{getResultUnit()}</span>
                  </p>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ElectricalCalculator;
