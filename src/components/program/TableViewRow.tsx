import { ExerciseBlock } from '@/types';
import { getContrastTextColor, adjustColor } from '@/lib/colorUtils';

interface WeekData {
  weekNum: number;
  schema: string;
  loads: string;
  notes: string;
  block?: ExerciseBlock;
}

interface LoggedData {
  weekNum: number;
  resoconto: string;
}

interface ExerciseRowData {
  exerciseName: string;
  muscleGroup: string;
  exerciseIndex: number;
  blocks: {
    blockIndex: number;
    rest: number;
    weekData: WeekData[];
    loggedData: LoggedData[];
  }[];
}

interface TableViewRowProps {
  row: ExerciseRowData;
  weekNumbers: number[];
  muscleColor: string;
  isFirstInGroup: boolean;
  groupRowCount: number;
}

export function TableViewRow({ 
  row, 
  weekNumbers, 
  muscleColor,
  isFirstInGroup,
  groupRowCount 
}: TableViewRowProps) {
  const block = row.blocks[0];
  if (!block) return null;
  
  // Stile per il gruppo muscolare
  const groupStyle = {
    backgroundColor: muscleColor,
    color: getContrastTextColor(muscleColor),
  };
  
  // Stile per le celle resoconto (colorate in magenta come nell'immagine)
  const resocontoStyle = {
    backgroundColor: adjustColor('#d946ef', 0.85), // Magenta chiaro
    color: '#831843',
  };
  
  return (
    <div 
      className="grid border-b border-border hover:bg-muted/30 transition-colors"
      style={{ 
        gridTemplateColumns: `150px 200px ${weekNumbers.map(() => '80px 200px 200px').join(' ')}` 
      }}
    >
      {/* Gruppo Muscolare */}
      {isFirstInGroup ? (
        <div 
          className="p-3 font-bold text-sm border-r border-border flex items-center"
          style={{ 
            ...groupStyle,
            gridRow: groupRowCount > 1 ? `span ${groupRowCount}` : undefined,
          }}
        >
          <span className="uppercase tracking-wide">{row.muscleGroup}</span>
        </div>
      ) : null}
      
      {/* Nome Esercizio */}
      <div className="p-3 text-sm border-r border-border">
        <div className="font-medium">{row.exerciseName}</div>
        {block.blockIndex > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            Blocco {block.blockIndex + 1}
          </div>
        )}
      </div>
      
      {/* Colonne per ogni settimana */}
      {weekNumbers.map((weekNum, weekIndex) => {
        const weekData = block.weekData[weekIndex];
        const loggedData = block.loggedData[weekIndex];
        
        return (
          <div key={weekNum} className="contents">
            {/* REST */}
            <div className="p-3 text-sm border-r border-border text-center bg-muted/30">
              {weekData?.block?.rest || block.rest || '-'}
            </div>
            
            {/* WEEK - Schema */}
            <div className="p-3 text-xs border-r border-border bg-white">
              <div className="space-y-1">
                {/* Schema principale */}
                <div className="font-semibold text-gray-900">
                  {weekData?.schema || '-'}
                </div>
                
                {/* Carichi */}
                {weekData?.loads && weekData.loads !== '-' && (
                  <div className="text-gray-600">
                    {weekData.loads}
                  </div>
                )}
                
                {/* Note/Tecnica */}
                {weekData?.notes && (
                  <div className="text-muted-foreground whitespace-pre-line text-[11px] mt-1 leading-tight">
                    {weekData.notes}
                  </div>
                )}
              </div>
            </div>
            
            {/* RESOCONTO */}
            <div 
              className="p-3 text-xs border-r border-border"
              style={loggedData?.resoconto ? resocontoStyle : { backgroundColor: '#fafafa' }}
            >
              {loggedData?.resoconto ? (
                <div className="whitespace-pre-line leading-tight">
                  {loggedData.resoconto}
                </div>
              ) : (
                <span className="text-muted-foreground italic">-</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

