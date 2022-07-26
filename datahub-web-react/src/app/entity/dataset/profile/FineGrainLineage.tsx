import React, { useMemo } from 'react';
import ReactFlow, { useEdgesState, Node, ReactFlowProvider, useNodesState, Edge } from 'react-flow-renderer';
import { gql, useApolloClient } from '@apollo/client';
// import { FineGrainedLineage } from '../../../../types.generated';
import { useEntityData } from '../../shared/EntityContext';
import ColumnNode from './reactFlowNode/ColumnNode';
import TableNode from './reactFlowNode/TableNode';

const urnExtractor = new RegExp('urn:li:schemaField:[(](.+),(.+)[)]');

type GetDataSetQuery = {
    urn: string;
};

type DatasetInfo = {
    dataset: {
        urn: string;
        name: string;
        schemaMetadata: {
            name: string;
            fields: {
                fieldPath: string;
                type: string;
            }[];
        };
    };
};

const getDatasetInfo = gql`
    query getDataSetTest($urn: String!) {
        dataset(urn: $urn) {
            urn
            name
            schemaMetadata(version: -1) {
                name
                fields {
                    fieldPath
                    type
                }
            }
        }
    }
`;

function makeFieldUrn(datasetURN: string, fieldPath: string) {
    return `urn:li:schemaField:(${datasetURN},${fieldPath})`;
}

export default function FineGrainLineagesTab() {
    const nodeTypes = useMemo(() => ({ columnNode: ColumnNode, tableNode: TableNode }), []);
    const { urn, entityData } = useEntityData();
    // const upstreamLineages = entityData?.upstreamLineages;
    // const fineGrainLineages = upstreamLineages?.fineGrainedLineages;
    const client = useApolloClient();
    const initialNodes = [
        {
            id: '0',
            type: 'tableNode',
            data: { label: 'Car Input' },
            position: { x: 0, y: 0 },
            style: {
                width: 170,
                height: 300,
                backgroundColor: 'rgba(240,240,240,0.25)',
            },
        },
        {
            id: '1',
            type: 'columnNode',
            data: { label: 'Input Node' },
            parentNode: '0',
            position: { x: 10, y: 25 },
        },
        {
            id: '2',
            type: 'columnNode',
            // you can also pass a React component as a label
            data: { label: <div>Default Node</div> },
            parentNode: '0',
            position: { x: 10, y: 50 },
        },
        {
            id: '3',
            type: 'columnNode',
            data: { label: 'Output Node' },
            position: { x: 250, y: 250 },
        },
    ];

    const initialEdges = [
        { id: 'e1-2', source: '1', target: '3', animated: false },
        { id: 'e2-3', source: '2', target: '3' },
    ];
    const [nodes, setNodes, onNodesChange] = useNodesState<any>(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    async function lazyLoad() {
        // urn:li:schemaField:(urn:li:dataset:(urn:li:dataPlatform:s3,techx-dpf-demo-curated-zone/export_data/TX/CAR_FINAL,PROD),CLIENT_TYPE)
        const upstreamURNs = new Set<string>();
        const fineGrainLineages = entityData?.upstreamLineages?.fineGrainedLineages;
        const lineageNodes: Node[] = [];
        const lineageEdges: Edge[] = [];
        const rowSpacing = 17;
        let totalFieldCount = 0;
        if (fineGrainLineages !== null && fineGrainLineages !== undefined && entityData && entityData.schemaMetadata) {
            lineageNodes.push({
                id: urn,
                type: 'tableNode',
                data: { label: entityData.schemaMetadata.name },
                position: { x: 300, y: 0 },
                style: {
                    height: rowSpacing * (entityData.schemaMetadata.fields.length + 2),
                    backgroundColor: 'rgba(240,240,240,0.25)',
                },
            });
            totalFieldCount += 1;
            entityData.schemaMetadata.fields.forEach((field) => {
                lineageNodes.push({
                    id: makeFieldUrn(urn, field.fieldPath),
                    type: 'columnNode',
                    data: { label: field.fieldPath },
                    position: { x: 10, y: 0 + totalFieldCount * rowSpacing },
                    parentNode: urn,
                });
                totalFieldCount += 1;
            });
            fineGrainLineages.forEach((lin) => {
                if (lin.upstreams && lin.downstreams && lin.downstreams.length === 1) {
                    const downstreamFieldUrn = lin.downstreams[0];
                    lin.upstreams?.forEach((upt) => {
                        const match = urnExtractor.exec(upt);
                        if (match !== null) {
                            upstreamURNs.add(match[1]);
                            lineageEdges.push({
                                id: `${upt}-${downstreamFieldUrn}`,
                                source: upt,
                                target: downstreamFieldUrn,
                            });
                        }
                    });
                }
            });
            console.log(upstreamURNs);
            const upstreamDataSet: DatasetInfo[] = [];
            await Promise.all(
                Array.from(upstreamURNs.values()).map(async (upstreamURN) => {
                    const { data } = await client.query<DatasetInfo, GetDataSetQuery>({
                        query: getDatasetInfo,
                        variables: { urn: upstreamURN },
                    });
                    upstreamDataSet.push(data);
                }),
            );
            totalFieldCount = 0;
            upstreamDataSet.forEach((upstreamInfo) => {
                console.log(upstreamInfo.dataset);
                if (upstreamInfo.dataset.schemaMetadata) {
                    lineageNodes.push({
                        id: upstreamInfo.dataset.urn,
                        type: 'tableNode',
                        data: { label: upstreamInfo.dataset.schemaMetadata.name },
                        position: { x: 0, y: totalFieldCount * rowSpacing },
                        style: {
                            height: rowSpacing * (upstreamInfo.dataset.schemaMetadata.fields.length + 2),
                            backgroundColor: 'rgba(240,240,240,0.25)',
                        },
                    });
                    totalFieldCount += 1;
                    // Add more fields
                    upstreamInfo.dataset.schemaMetadata.fields.forEach((field) => {
                        lineageNodes.push({
                            id: makeFieldUrn(upstreamInfo.dataset.urn, field.fieldPath),
                            type: 'columnNode',
                            data: { label: field.fieldPath },
                            position: { x: 10, y: totalFieldCount * rowSpacing },
                            parentNode: upstreamInfo.dataset.urn,
                        });
                        totalFieldCount += 1;
                    });
                }
            });
            console.log(lineageNodes);
            console.log(lineageEdges);
            setNodes(lineageNodes);
            setEdges(lineageEdges);
        }

        // Positioning
        // Start at 0, 0. Each dataset have some spacing
        // Each field tag span 25 width
        // Upstream Start first, then go Right, spacing 250
        //
    }

    function onNodeClick(_event: React.MouseEvent, node: Node<any>) {
        if (node.type === 'columnNode') {
            console.log(node.type);
            // const edges = getConnectedEdges([node], []);
            // console.log(edges);
            // node.style = { background: "#f00" };
            const relatedNodeIds: string[] = [];
            setEdges((edges0) =>
                edges0.map((edge) => {
                    const newEdge = { ...edge, animated: false };
                    if (edge.source === node.id || edge.target === node.id) {
                        newEdge.animated = true;
                    } else {
                        newEdge.animated = false;
                    }
                    return newEdge;
                }),
            );
            edges.forEach((edge) => {
                if (edge.source === node.id) {
                    relatedNodeIds.push(edge.target);
                }
                if (edge.target === node.id) {
                    relatedNodeIds.push(edge.source);
                }
            });
            console.log(relatedNodeIds.length);
            setNodes((nodes0) =>
                nodes0.map((node0) => {
                    const newNode = node0;
                    if (relatedNodeIds.includes(node0.id)) {
                        newNode.selected = true;
                        console.log(newNode);
                    }
                    return newNode;
                }),
            );
        }
    }

    function onPaneClick(_event: React.MouseEvent) {
        setEdges((edges0) =>
            edges0.map((edge) => {
                const newEdge = { ...edge, animated: false };
                return newEdge;
            }),
        );
    }
    return (
        <ReactFlowProvider>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onInit={lazyLoad}
                onNodeClick={onNodeClick}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodesDraggable={false}
                onPaneClick={onPaneClick}
                // onConnect={onConnect}
                fitView
            >
                {/* <MiniMap />
            <Controls /> */}
            </ReactFlow>
        </ReactFlowProvider>
    );
}
