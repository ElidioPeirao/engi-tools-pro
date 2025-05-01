
import React, { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EngineeringCalculator = () => {
  const [calcType, setCalcType] = useState("forces");
  const [value1, setValue1] = useState("");
  const [value2, setValue2] = useState("");
  const [unit, setUnit] = useState("N");
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const num1 = parseFloat(value1);
    const num2 = parseFloat(value2);
    
    if (isNaN(num1) || isNaN(num2)) {
      setResult(null);
      return;
    }

    let calculatedResult = 0;
    
    switch (calcType) {
      case "forces":
        calculatedResult = num1 * num2; // Força = massa * aceleração
        break;
      case "stress":
        calculatedResult = num1 / num2; // Tensão = força / área
        break;
      case "moments":
        calculatedResult = num1 * num2; // Momento = força * distância
        break;
      default:
        calculatedResult = 0;
    }
    
    setResult(calculatedResult);
  };

  const getResultUnit = () => {
    switch (calcType) {
      case "forces":
        return "N";
      case "stress":
        return "Pa";
      case "moments":
        return "N·m";
      default:
        return "";
    }
  };

  return (
    <Layout title="Calculadora de Engenharia">
      <div className="max-w-3xl mx-auto">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <Tabs defaultValue="forces" onValueChange={setCalcType} className="w-full">
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="forces">Forças</TabsTrigger>
                <TabsTrigger value="stress">Tensão</TabsTrigger>
                <TabsTrigger value="moments">Momentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="forces" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mass">Massa (kg)</Label>
                  <Input
                    id="mass"
                    type="number"
                    placeholder="Insira a massa"
                    value={value1}
                    onChange={(e) => setValue1(e.target.value)}
                    className="bg-black/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="acceleration">Aceleração (m/s²)</Label>
                  <Input
                    id="acceleration"
                    type="number"
                    placeholder="Insira a aceleração"
                    value={value2}
                    onChange={(e) => setValue2(e.target.value)}
                    className="bg-black/50"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="stress" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="force">Força (N)</Label>
                  <Input
                    id="force"
                    type="number"
                    placeholder="Insira a força"
                    value={value1}
                    onChange={(e) => setValue1(e.target.value)}
                    className="bg-black/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="area">Área (m²)</Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="Insira a área"
                    value={value2}
                    onChange={(e) => setValue2(e.target.value)}
                    className="bg-black/50"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="moments" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="force-moment">Força (N)</Label>
                  <Input
                    id="force-moment"
                    type="number"
                    placeholder="Insira a força"
                    value={value1}
                    onChange={(e) => setValue1(e.target.value)}
                    className="bg-black/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="distance">Distância (m)</Label>
                  <Input
                    id="distance"
                    type="number"
                    placeholder="Insira a distância"
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
                <div className="mt-8 p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
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

export default EngineeringCalculator;
