import { Button, Form, Input, Popconfirm, TableProps } from 'antd';
import type { FormInstance } from 'antd/lib/form';
import React, { useContext, useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import CSVParser, { IFileInfo } from '../../utils/CSVParser';
import { ANTD_GRAY } from '../../constants';
import { StyledTable } from '../../components/styled/StyledTable';

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface Item {
    key: string;
    value: string;
}

interface EditableRowProps {
    index: number;
}

const TitleContainer = styled.div`
    align-items: center;
    border-bottom: solid 1px ${ANTD_GRAY[4]};
    display: flex;
    justify-content: space-between;
    padding: 15px 20px;
    margin-bottom: 30px;
`;

const EditableRow: React.FC<EditableRowProps> = (eprops: EditableRowProps) => {
    const [form] = Form.useForm();
    const { index, ...props } = eprops;
    return (
        <Form form={form} component={false} id={index?.toString()}>
            <EditableContext.Provider value={form}>
                <tr {...props} />
            </EditableContext.Provider>
        </Form>
    );
};

interface EditableCellProps {
    title: React.ReactNode;
    editable: boolean;
    children: React.ReactNode;
    dataIndex: keyof Item;
    record: Item;
    handleSave: (record: Item) => void;
}

const EditableCell: React.FC<EditableCellProps> = (props: EditableCellProps) => {
    const { title, editable, children, dataIndex, record, handleSave } = props;
    const [editing, setEditing] = useState(false);
    // const inputRef = useRef<InputRef>(null);
    const inputRef = React.createRef<Input>();
    const form = useContext(EditableContext)!;

    useEffect(() => {
        if (editing) {
            inputRef.current!.focus();
        }
    }, [editing, inputRef]);

    const toggleEdit = () => {
        setEditing(!editing);
        form.setFieldsValue({ [dataIndex]: record[dataIndex] });
    };

    const save = async () => {
        try {
            const values = await form.validateFields();

            toggleEdit();
            handleSave({ ...record, ...values });
        } catch (errInfo) {
            console.log('Save failed:', errInfo);
        }
    };

    let childNode = children;

    if (editable) {
        childNode = editing ? (
            <Form.Item
                style={{ margin: 0 }}
                name={dataIndex}
                rules={[
                    {
                        required: true,
                        message: `${title} is required.`,
                    },
                ]}
            >
                <Input ref={inputRef} onPressEnter={save} onBlur={save} />
            </Form.Item>
        ) : (
            <Form className="editable-cell-value-wrap" style={{ paddingRight: 24 }} onClick={toggleEdit}>
                {children}
            </Form>
        );
    }

    return <td>{childNode}</td>;
};

export interface PropertyDataType {
    key: React.Key;
    name: string;
    value: string;
}

type EditableTableProps = TableProps<PropertyDataType>;

interface Props {
    dataSource: PropertyDataType[];
    setDataSource: React.Dispatch<React.SetStateAction<PropertyDataType[]>>;
}

type ColumnTypes = Exclude<EditableTableProps['columns'], undefined>;

export default function PropertiesTermsTable(props: Props) {
    const { dataSource, setDataSource } = props;

    const [count, setCount] = useState(dataSource.length);

    const handleDelete = (key: React.Key) => {
        const newData = dataSource.filter((item) => item.key !== key);
        setDataSource(newData);
    };

    const defaultColumns: (ColumnTypes[number] & { editable?: boolean; dataIndex: string })[] = [
        {
            title: 'Name',
            dataIndex: 'name',
            width: '30%',
            editable: true,
        },
        {
            title: 'Value',
            dataIndex: 'value',
            editable: true,
        },
        {
            title: 'Operation',
            dataIndex: 'operation',
            render: (_, record: { key: React.Key }) =>
                dataSource.length >= 1 ? (
                    <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.key)}>
                        <Button>Delete</Button>
                    </Popconfirm>
                ) : null,
        },
    ];

    const handleAdd = () => {
        const newData: PropertyDataType = {
            key: count,
            name: 'Add a key',
            value: 'Add some value',
        };
        setDataSource([...dataSource, newData]);
        setCount(count + 1);
    };

    const handleSave = (row: PropertyDataType) => {
        const newData = [...dataSource];
        const index = newData.findIndex((item) => row.key === item.key);
        const item = newData[index];
        newData.splice(index, 1, {
            ...item,
            ...row,
        });
        setDataSource(newData);
    };

    const components = {
        body: {
            row: EditableRow,
            cell: EditableCell,
        },
    };

    const columns = defaultColumns.map((col) => {
        if (!col.editable) {
            return col;
        }
        return {
            ...col,
            onCell: (record: PropertyDataType) => ({
                record,
                editable: col.editable,
                dataIndex: col.dataIndex,
                title: col.title,
                handleSave,
            }),
        };
    });

    const papaparseOptions = {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.toLowerCase().replace(/\W/g, '_'),
    };

    const handleFileUpload = (data: PropertyDataType[], _fileInfo: IFileInfo) => {
        // console.log(`Filename: ${fileInfo.name} Size: ${fileInfo.size}`);
        data.forEach((e, i) => {
            e.key = i;
        });
        // console.log(data);
        setDataSource(data);
    };

    return (
        <div>
            <TitleContainer>
                <Button onClick={handleAdd} type="primary" style={{ marginBottom: 16 }}>
                    <PlusOutlined /> Row
                </Button>
                <CSVParser
                    cssClass="react-csv-input"
                    label="Select CSV"
                    onFileLoaded={handleFileUpload}
                    parserOptions={papaparseOptions}
                />
            </TitleContainer>
            <StyledTable
                components={components}
                rowClassName={() => 'editable-row'}
                bordered
                dataSource={dataSource}
                columns={columns as ColumnTypes}
            />
        </div>
    );
}
