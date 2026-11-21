from pathlib import Path

def test_health(client):
    h=client.get('/api/v1/health')
    assert h.status_code==200
    data=h.json()
    assert data['molecules']==3 and data['database_ready']
    assert data['agent_modes']==['TOOLS_ONLY']


def test_search_and_lookup(client):
    data=client.get('/api/v1/molecules/search',params={'q':'CHEMBL2'}).json()
    assert data['hits'][0]['chembl_id']=='CHEMBL25'
    assert client.get('/api/v1/molecules/CHEMBL42').json()['record']['canonical_smiles']=='CCO'
    assert client.get('/api/v1/molecules/CHEMBL999').status_code==404
    assert client.get('/api/v1/molecules/invalid').status_code==422
    assert client.get('/api/v1/molecules/search',params={'q':'aspirin'}).status_code==422


def test_rdkit_descriptors(client):
    r=client.post('/api/v1/molecules/describe',json={'smiles':'CCO'})
    assert r.status_code==200 and r.json()['molecular_formula_rdkit']=='C2H6O'
    assert client.post('/api/v1/molecules/describe',json={'smiles':'not a smile?'}).status_code==422


def test_agent_is_honest(client):
    r=client.post('/api/v1/agent/query',json={'question':'Please explain CHEMBL42'})
    assert r.status_code==200
    result=r.json()
    assert result['mode']=='TOOLS_ONLY'
    assert result['model'] is None
    assert result['tools'][0]['tool']=='lookup_molecule'
    assert any(e['chembl_id']=='CHEMBL42' for e in result['evidence'])
    assert client.post('/api/v1/agent/query',json={'question':'Explain CHEMBL42', 'use_llm':True}).status_code==409


def test_similarity_requires_fp_index(client):
    r=client.post('/api/v1/molecules/similar',json={'chembl_id':'CHEMBL42'})
    assert r.status_code==503


def test_invalid_request_and_public_cors(client):
    assert client.post('/api/v1/agent/query',json={'question':'x'}).status_code==422
    opts=client.options('/api/v1/molecules/search',headers={'Origin':'http://localhost:5173','Access-Control-Request-Method':'GET'})
    assert opts.headers.get('access-control-allow-origin')=='http://localhost:5173'
    disallowed=client.options('/api/v1/molecules/search',headers={'Origin':'https://evil.example','Access-Control-Request-Method':'GET'})
    assert disallowed.headers.get('access-control-allow-origin') is None


def test_missing_db(tmp_path):
    from fastapi.testclient import TestClient
    from backend.app.main import create_app
    with TestClient(create_app(tmp_path/'missing.sqlite', tmp_path/'none.sqlite')) as c:
        assert c.get('/api/v1/health').json()['status']=='database_missing'
        assert c.get('/api/v1/molecules/CHEMBL25').status_code==503


def test_fingerprint_builder_and_subset(client,fixture_db,tmp_path):
    from backend.scripts.build_fingerprints import build
    out=tmp_path/'fps.sqlite'
    meta=build(fixture_db,out,limit=2)
    assert meta['scanned_this_run']==2
    assert meta['indexed_total']==2
    meta2=build(fixture_db,out,limit=0)
    assert meta2['indexed_total']==3
    result=client.post('/api/v1/molecules/similar',json={'chembl_id':'CHEMBL42','max_candidates':3}).json()
    assert len(result['hits'])==2
    assert result['screened_fingerprints']==3
    assert 'NOT global nearest' in result['scope_warning']
    assert result['hits'][0]['chembl_id']=='CHEMBL43'
