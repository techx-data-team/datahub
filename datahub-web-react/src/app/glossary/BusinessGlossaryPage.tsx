import React, { useState } from 'react';
import { Button, Typography } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import styled from 'styled-components/macro';

import { useGetRootGlossaryNodesQuery, useGetRootGlossaryTermsQuery } from '../../graphql/glossary.generated';
import TabToolbar from '../entity/shared/components/styled/TabToolbar';
import GlossaryEntitiesPath from './GlossaryEntitiesPath';
import GlossaryEntitiesList from './GlossaryEntitiesList';
import GlossaryBrowser from './GlossaryBrowser/GlossaryBrowser';
import GlossarySearch from './GlossarySearch';
import { ProfileSidebarResizer } from '../entity/shared/containers/profile/sidebar/ProfileSidebarResizer';
import EmptyGlossarySection from './EmptyGlossarySection';
import CreateGlossaryEntityModal from '../entity/shared/EntityDropdown/CreateGlossaryEntityModal';
import ImportCSVModal from '../entity/shared/tabs/Properties/ImportCSVModal';
import { EntityType } from '../../types.generated';

export const HeaderWrapper = styled(TabToolbar)`
    padding: 15px 45px 10px 24px;
    height: auto;
`;

const GlossaryWrapper = styled.div`
    display: flex;
    flex: 1;
    max-height: inherit;
`;

const MainContentWrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

export const BrowserWrapper = styled.div<{ width: number }>`
    max-height: 100%;
    min-width: ${(props) => props.width}px;
`;

export const MAX_BROWSER_WIDTH = 500;
export const MIN_BROWSWER_WIDTH = 200;

function BusinessGlossaryPage() {
    const [browserWidth, setBrowserWidth] = useState(window.innerWidth * 0.2);
    const { data: termsData, refetch: refetchForTerms } = useGetRootGlossaryTermsQuery();
    const { data: nodesData, refetch: refetchForNodes } = useGetRootGlossaryNodesQuery();

    const terms = termsData?.getRootGlossaryTerms?.terms;
    const nodes = nodesData?.getRootGlossaryNodes?.nodes;

    const hasTermsOrNodes = !!nodes?.length || !!terms?.length;

    const [isCreateTermModalVisible, setIsCreateTermModalVisible] = useState(false);
    const [isCreateNodeModalVisible, setIsCreateNodeModalVisible] = useState(false);
    const [isImportCSVModalVisible, setImportCSVModalVisible] = useState(false);

    return (
        <>
            <GlossaryWrapper>
                <BrowserWrapper width={browserWidth}>
                    <GlossarySearch />
                    <GlossaryBrowser rootNodes={nodes} rootTerms={terms} />
                </BrowserWrapper>
                <ProfileSidebarResizer
                    setSidePanelWidth={(width) =>
                        setBrowserWidth(Math.min(Math.max(width, MIN_BROWSWER_WIDTH), MAX_BROWSER_WIDTH))
                    }
                    initialSize={browserWidth}
                    isSidebarOnLeft
                />
                <MainContentWrapper>
                    <GlossaryEntitiesPath />
                    <HeaderWrapper>
                        <Typography.Title level={3}>Glossary</Typography.Title>
                        <div>
                            <Button type="text" onClick={() => setIsCreateTermModalVisible(true)}>
                                <PlusOutlined /> Add Term
                            </Button>
                            <Button type="text" onClick={() => setIsCreateNodeModalVisible(true)}>
                                <PlusOutlined /> Add Term Group
                            </Button>
                            <Button type="text" onClick={() => setImportCSVModalVisible(true)}>
                                <UploadOutlined /> Import by CSV
                            </Button>
                        </div>
                    </HeaderWrapper>
                    {hasTermsOrNodes && <GlossaryEntitiesList nodes={nodes || []} terms={terms || []} />}
                    {!hasTermsOrNodes && (
                        <EmptyGlossarySection refetchForTerms={refetchForTerms} refetchForNodes={refetchForNodes} />
                    )}
                </MainContentWrapper>
            </GlossaryWrapper>
            {isCreateTermModalVisible && (
                <CreateGlossaryEntityModal
                    entityType={EntityType.GlossaryTerm}
                    onClose={() => setIsCreateTermModalVisible(false)}
                    refetchData={refetchForTerms}
                />
            )}
            {isCreateNodeModalVisible && (
                <CreateGlossaryEntityModal
                    entityType={EntityType.GlossaryNode}
                    onClose={() => setIsCreateNodeModalVisible(false)}
                    refetchData={refetchForNodes}
                />
            )}
            {isImportCSVModalVisible && (
                <ImportCSVModal onClose={() => setImportCSVModalVisible(false)} refetchData={refetchForNodes} />
            )}
        </>
    );
}

export default BusinessGlossaryPage;
