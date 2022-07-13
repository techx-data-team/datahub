import React, { useState } from 'react';
import { message, Button, Modal } from 'antd';
// import styled from 'styled-components/macro';
// import { useUpdateCustomPropertiesMutation } from '../../../../../graphql/mutations.generated';
// import { StringMapEntryInput } from '../../../../../types.generated';
import { EntityType } from '../../../../../types.generated';
// import { useEntityRegistry } from '../../../../useEntityRegistry';
// import { useRefetch } from '../../EntityContext';
import PropertiesTermsTable, { PropertyDataType } from './PropertiesTermsTable';
import { useGetSearchResultsForMultipleQuery } from '../../../../../graphql/search.generated';
// import { useGetGlossaryTermQuery } from '../../../../../graphql/glossaryTerm.generated';

// import analytics, { EventType, EntityActionType } from '../../../../analytics';
interface Props {
    onClose: () => void;
}

function ImportCSVModal(props: Props) {
    const { onClose } = props;
    const customPropsInit: PropertyDataType[] = [];
    const [dataSource, setDataSource] = useState(customPropsInit);
    const [importButtonDisabled, setimportButtonDisabled] = useState(false);
    // const refetch = useRefetch();

    const queryTmp = '';
    const { data } = useGetSearchResultsForMultipleQuery({
        variables: {
            input: {
                types: [EntityType.GlossaryTerm, EntityType.GlossaryNode],
                query: queryTmp,
                start: 0,
                count: 50,
            },
        },
        skip: !importButtonDisabled,
    });
    const searchResults = data?.searchAcrossEntities?.searchResults;

    console.log('searchResults: ', searchResults);
    console.log('dataSource', dataSource);

    function importGlossaryEntity() {
        setimportButtonDisabled(true);
        message.loading({ content: 'Saving new glossarys and terms...' });
        var dict = {
            "GLOSSARY_TERM": {},
            "GLOSSARY_NODE": {}
        }
        
        setimportButtonDisabled(false);
        onClose();
    }

    return (
        <Modal
            title="Import Glossary Term from csv file"
            width={1000}
            visible
            onCancel={onClose}
            footer={
                <>
                    <Button onClick={onClose} type="text">
                        Cancel
                    </Button>
                    <Button onClick={importGlossaryEntity} disabled={importButtonDisabled}>
                        Import
                    </Button>
                </>
            }
        >
            <PropertiesTermsTable dataSource={dataSource} setDataSource={setDataSource} />
        </Modal>
    );
}
export default ImportCSVModal;
