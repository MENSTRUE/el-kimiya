import sqlite3
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from backend.app.main import create_app

@pytest.fixture
def fixture_db(tmp_path: Path):
    db=tmp_path/'chembl_37.sqlite'
    with sqlite3.connect(db) as con:
        con.execute('CREATE TABLE molecules (chembl_id TEXT PRIMARY KEY, canonical_smiles TEXT NOT NULL, standard_inchi TEXT, standard_inchi_key TEXT) WITHOUT ROWID')
        con.executemany('INSERT INTO molecules VALUES (?,?,?,?)',[
            ('CHEMBL25','CC(=O)Oc1ccccc1C(=O)O','InChI=1S/aspirin','BSYNRYMUTXBXSQ-UHFFFAOYSA-N'),
            ('CHEMBL42','CCO','InChI=1S/ethanol','LFQSCWFLJHTTHZ-UHFFFAOYSA-N'),
            ('CHEMBL43','CCCO','InChI=1S/propanol','BDERNNFJNOPAEC-UHFFFAOYSA-N'),
        ])
    return db

@pytest.fixture
def client(fixture_db,tmp_path,monkeypatch):
    monkeypatch.delenv('GEMINI_API_KEY',raising=False)
    with TestClient(create_app(fixture_db, tmp_path/'fps.sqlite')) as c:
        yield c
