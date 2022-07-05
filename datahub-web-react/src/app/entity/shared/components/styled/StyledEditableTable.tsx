import { Button, Form, Input, Popconfirm, TableProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd/lib/form';
import styled from 'styled-components';
import React, { useContext, useEffect, useState } from 'react';
import { StyledTable } from './StyledTable';
import CSVParser, { IFileInfo } from '../../utils/CSVParser';
import { ANTD_GRAY } from '../../constants';

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface EditableRowProps {
    index: number;
}

export interface BaseItem {
    internal_key: string | number;
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

interface EditableCellProps<T extends BaseItem> {
    title: React.ReactNode;
    editable: boolean;
    children: React.ReactNode;
    dataIndex: keyof T;
    record: T;
    handleSave: (record: T) => void;
}

function EditableCell<T extends BaseItem>(props: EditableCellProps<T>) {
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
                name={dataIndex.toString()}
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
}

type EditableTableProps<T extends BaseItem> = TableProps<T>;

type ColumnTypes<T extends BaseItem> = Exclude<EditableTableProps<T>['columns'], undefined>;

export interface StyledEditableTableProps<T extends BaseItem> {
    dataSource: T[];
    setDataSource: React.Dispatch<React.SetStateAction<T[]>>;
    columnList: (ColumnTypes<T>[number] & { editable?: boolean; dataIndex: string })[];
    defaultItemGen: (key: string | number) => T;
}

export default function StyledEditableTable<T extends BaseItem>(props: StyledEditableTableProps<T>) {
    const { dataSource, setDataSource, columnList, defaultItemGen } = props;
    const [count, setCount] = useState(dataSource.length);

    const handleDelete = (key: React.Key) => {
        const newData = dataSource.filter((item) => item.internal_key !== key);
        setDataSource(newData);
    };

    const defaultColumns: (ColumnTypes<T>[number] & { editable?: boolean; dataIndex: string })[] = [
        // {
        //     title: 'Name',
        //     dataIndex: 'name',
        //     width: '30%',
        //     editable: true,
        // },
        // {
        //     title: 'Value',
        //     dataIndex: 'value',
        //     editable: true,
        // },
        ...columnList,
        {
            title: 'Operation',
            dataIndex: 'operation',
            render: (_, record: { internal_key: React.Key }) =>
                dataSource.length >= 1 ? (
                    <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.internal_key)}>
                        <Button>Delete</Button>
                    </Popconfirm>
                ) : null,
        },
    ];

    const handleAdd = () => {
        const newData: T = defaultItemGen(count);
        setDataSource([...dataSource, newData]);
        setCount(count + 1);
    };

    const handleSave = (row: T) => {
        const newData = [...dataSource];
        const index = newData.findIndex((item) => row.internal_key === item.internal_key);
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
            onCell: (record: T) => ({
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

    const handleFileUpload = (data: T[], _fileInfo: IFileInfo) => {
        // console.log(`Filename: ${fileInfo.name} Size: ${fileInfo.size}`);
        data.forEach((e, i) => {
            e.internal_key = i;
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
                    label="Select CSV with name/value column only"
                    onFileLoaded={handleFileUpload}
                    parserOptions={papaparseOptions}
                />
            </TitleContainer>
            <StyledTable
                components={components}
                rowClassName={() => 'editable-row'}
                bordered
                dataSource={dataSource}
                columns={columns as ColumnTypes<T>}
            />
        </div>
    );
}
