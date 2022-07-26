import React from 'react';
import { Handle, Position, NodeProps } from 'react-flow-renderer';

type NodeData = {
    label: string;
};

export default function ColumnNode(props: NodeProps<NodeData>) {
    return (
        <div>
            <Handle type="target" position={Position.Left} />
            {props.data?.label}
            <Handle type="source" position={Position.Right} />
        </div>
    );
}
