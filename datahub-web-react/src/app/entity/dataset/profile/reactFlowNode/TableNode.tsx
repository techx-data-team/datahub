import React from 'react';
import { NodeProps } from 'react-flow-renderer';

type NodeData = {
    label: string;
};

export default function TableNode(props: NodeProps<NodeData>) {
    return <div>{props.data?.label}</div>;
}
