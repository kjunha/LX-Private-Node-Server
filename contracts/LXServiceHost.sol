//LXServiceHost 최종 검토본 README
//에러메세지 설명
//[****0]: RESIDENCE_NUM_<EXISTANCE> / 주소 고유등록번호의 고유성 및 등록여부 확인 (uniqueResidenceNum 매핑 참조)
//[****1]: MYGEONICK_<EXISTANCE> / MyGeonick의 고유성 및 등록여부 확인 (uniqueMyGeonick 매핑 참조)
//[****2]: GS1_CODE_<EXISTANCE> / GS1 코드의 고유성 및 등록여부 확인 (uniqueGS1Code 매핑 참조)
//[****3]: ACCESS_DENIED / 어드민은 모든 계정의 주소에 대해 접근권한을 가지지만, 각 계정은 본인의 계정 이외의 다른 계정을 파라미터로 활용 불가능
//[****4]: MEMBER_IS_<OWNERSHIP> / 주어진 회원주소가 주소 고유등록번호의 소유주로 등록되어있는지 확인 (residenceOwner 매핑 참조)
//[****5]: RESIDENCE_NUM_<EXISTANCE> / 주어진 주소 고유등록번호가 회원 구조체에 저장되어있는지 확인 (Member 구조체 및 residenceIndex 참조)
//[****6]: MEMBER_ADDR_<EXISTANCE> / 주어진 회원 블록체인 주소가 등록되어있는지 확인 (uniqueMemberAddr 매핑 참조)
//
//이벤트 설명
//RegisterMember: 회원등록 이벤트
//ChangeResidence: 주소정보 등록 및 변경이력
//DeleteResidence: 주소정보 삭제 이벤트
//PreConsentTo: 주소정보 활용 사전승인 이벤트
//RealTimeConsentTo: 주소정보 활용 실시간승인 이벤트
//RequestForAddress: 요청자에 대한 주소정보 활용 이력 이벤트
//DeregisterMember: 회원등록 해제 이벤트
//
//변경 및 수정사항
//쓰던 안심주소(MyGeonick)을 업데이트 할 시 기존의 안심주소를 즉시 다른사람이 사용가능한지, 복구요청이 생길 수 있음으로 일정기간 이전에 사용된 주소를 막아둬야 할 지에 대해 정책적인 검토 필요함.
//(ex) 15일 유예기간을 거친 후 15일동안에 복구요청이 없을 시 이전에 사용한 주소를 다른사람이 다시 사용할 수 있음.
//이를위해 안심주소 고유성을 재확보할 수 있는 함수를 구현 >> 서비스 정책상 안심주소를 다른사람이 다시 사용할 수 있다고 판단될 시 블록체인 네트워크상에서 안심주소 고유성을 확보함.
//주소정보 삭제시에도 안심주소를 유예할 수 있도록 안심주소 고유성을 재확보 할 수 있는 기능성을 분리.
//
//질문사항
//--! 주소 및 회원기록 삭제시에도 유예기간 적용시 isActive를 이용해 회원주소 및 주소고유번호에도 비활성화 상태를 만들어 유예기간 후 삭제가능하게 하는 로직 구현 가능성?
//--! 블록 해쉬를 로깅 vs 블록 넘버 로깅?
//--! ERC-20 적용방안 고려수준

pragma solidity ^0.5.0;

contract LXServiceHost {
    //각 주소고유번호와 연관된 정보를 저장하는 구조체
    struct Residence {
        string myGeonick;
        string gs1;
        string streetAddress;
        string gridAddress;
        uint blockNumber;
        mapping(address => bool) accessApproved; // 기관별/서비스별 정보조회 권한 관리 
    }

    //각 사용자(회원)과 연관된 정보를 저장하는 구조체
    struct Member {
        uint256 residencesNumCount;
        mapping(uint256 => uint256) residencesIndex; //EDIT address pk - index of array map
        uint256[] residencesNum;
    }
    
    address admin;
    mapping(address => bool) uniqueMemberAddr;    //고유한 회원 블록체인 주소를 확인하는 맵
    mapping(uint256 => bool) uniqueResidencesNum; //고유한 주소키값(주소 고유번호)을 확인하는 맵
    mapping(string => bool) uniqueMyGeonick;      //고유한 마이지오닉을 확인하는 맵
    mapping(string => bool) uniqueGS1Code;        //고유한 gs1코드를 확인하는 맵
    mapping(uint256 => address) residencesOwner;  //주소 고유번호 - 소유주 를 연결시키는 맵
    mapping(uint256 => Residence) residences;     //주소 고유번호 - 관련정보 를 연결시키는 맵
    mapping(address => Member) members;           //회원주소 - 관련정보 를 연결시키는 맵
    
    //ERC-20을 사용한 추가적인 거래기능 구성
    //mapping(address => uint256) balances;
    
    event RegisterMember(address indexed _memberAddr, uint256 indexed _memberNum, uint256 indexed currentBlockNum);
    event ChangeResidence(address indexed _memberAddr, uint256 indexed _residenceNum, uint256 indexed currentBlockNum, uint256 previousBlockNum, string _myGeonick, string _gs1, string _streetAddress, string _gridAddress);
    event DeleteResidence(address indexed _memberAddr, uint256 indexed _residenceNum, uint256 indexed currentBlockNum, uint256 previousBlockNum, string _myGeonick, string _gs1, string _streetAddress, string _gridAddress);
    event PreConsentTo(address indexed _memberAddr, address indexed _requesterAddr, uint256 indexed currentBlockNum, uint256 _residenceNum, bool _approvalStatus);
    event RealTimeConsentTo(address indexed _memberAddr, address indexed _requesterAddr, uint256 indexed currentBlockNum, uint256 _residenceNum, bool _approvalStatus);
    event RequestForAddress(address indexed _requesterAddr, uint256 _residenceNum, uint256 indexed currentBlockNum);
    event DeregisterMember(address indexed _memberAddr, uint256 indexed _memberNum, uint256 indexed currentBlockNum);


    //생성자(constructor): 배포시 배포자를 스마트 계약 관리자로 등록
    constructor() public {admin = msg.sender;}

    //[[서비스 맴버쉽 관련 기능]]
    //새로운 사용자 등록
    //---파라미터
    //  _memberAddr: 회원의 SC주소
    //  _memberNum: 고유한 회원등록번호
    //---리턴
    // bool: 메소드 실행 성공 / 실패 (이하 함수에서는 설명 생략)
    function registerMember(address _memberAddr, uint256 _memberPk) public returns(bool) {
        require(!uniqueMemberAddr[_memberAddr], "[ERR-10036] MEMBER_ADDR_EXIST");
        uniqueMemberAddr[_memberAddr] = true;
        emit RegisterMember(_memberAddr, _memberPk, block.number);
        return true;
    }

    //사용자 삭제
    //---파라미터
    //  _memberAddr: 회원의 SC주소
    //  _memberPk: 고유한 회원등록번호
    //---리턴
    function deregisterMember(address _memberAddr, uint256 _memberPk) public returns(bool) {
        require(admin == msg.sender || _memberAddr == msg.sender, "[ERR-10093] ACCESS_DENIED");
        require(uniqueMemberAddr[_memberAddr], "[ERR-10096 MEMBER_ADDR_NOT_EXIST]");
        //remove all Residence info
        for(uint i = 0; i < members[_memberAddr].residencesNumCount; i++) {
            uint256 resNum = members[_memberAddr].residencesNum[i];
            uniqueMyGeonick[residences[resNum].myGeonick] = false;
            uniqueGS1Code[residences[resNum].gs1] = false;
            uniqueResidencesNum[resNum] = false;
            residencesOwner[resNum] = address(0);
            residences[resNum] = Residence({myGeonick: '', gs1: '', streetAddress: '', gridAddress: '', blockNumber:0});
        }
        uniqueMemberAddr[_memberAddr] = false;
        emit DeregisterMember(_memberAddr, _memberPk, block.number);
        return true;
    }

    //[[서비스 사용자 사용성 관련 기능]]
    //새로운 주소지 등록
    //---파라미터
    //  _memberAddr: 회원의 SC주소
    //  _residenceNum: 등록할 주소지의 고유한 키값
    //  _myGeonick: 마이지오닉 값
    //  _gs1: gs1값
    //  _streetAddress: 도로명 주소
    //  _gridAddress: 지번주소
    //---리턴
    //  bool: 메소드 실행 성공 / 실패 (이하 함수에서는 설명 생략)
    function registerResidence(
        address _memberAddr,
        uint256 _residenceNum, 
        string memory _myGeonick,
        string memory _gs1,
        string memory _streetAddress,
        string memory _gridAddress) public returns(bool) {
            require(!uniqueResidencesNum[_residenceNum], "[ERR-10010] RESIDENCE_NUM_EXISTS");
            require(!uniqueMyGeonick[_myGeonick], "[ERR-10011] MYGEONICK_EXISTS"); 
            require(!uniqueGS1Code[_gs1], "[ERR-10012] GS1_CODE_EXISTS");
            require(admin == msg.sender || _memberAddr == msg.sender, "[ERR-10013] ACCESS_DENIED");
            
            uniqueResidencesNum[_residenceNum] = true;
            uniqueMyGeonick[_myGeonick] = true;
            uniqueGS1Code[_gs1] = true;
            uint256 blockNum = block.number;
            residences[_residenceNum] = Residence({myGeonick: _myGeonick, gs1: _gs1, streetAddress: _streetAddress, gridAddress: _gridAddress, blockNumber: blockNum});
            residencesOwner[_residenceNum] = _memberAddr;
            //push > save index location > increase count
            members[_memberAddr].residencesNum.push(_residenceNum);
            members[_memberAddr].residencesNumCount += 1;
            members[_memberAddr].residencesIndex[_residenceNum] = members[_memberAddr].residencesNumCount;
            emit ChangeResidence(_memberAddr, _residenceNum, blockNum, 0, _myGeonick, _gs1, _streetAddress, _gridAddress);
            return true;
    }
    
    //등록된 주소지 정보 업데이트
    //---파라미터
    //  _memberAddr: 회원의 SC주소
    //  _residenceNum: 갱신할 주소지의 고유한 키값
    //  _myGeonick: 마이지오닉 값
    //  _gs1: gs1값
    //  _streetAddress: 도로명 주소
    //  _gridAddress: 지번주소
    //---리턴
    function updateResidence(
        address _memberAddr,
        uint256 _residenceNum,
        string memory _myGeonick,
        string memory _gs1,
        string memory _streetAddress,
        string memory _gridAddress) public returns(bool) {
        require(uniqueResidencesNum[_residenceNum], "[ERR-10040] RESIDENCE_NUM_NOT_EXISTS");
        require(!uniqueMyGeonick[_myGeonick], "[ERR-10041] MYGEONICK_EXISTS"); 
        require(!uniqueGS1Code[_gs1], "[ERR-10042] GS1_CODE_EXISTS");
        require(admin == msg.sender || _memberAddr == msg.sender, "[ERR-10043] ACCESS_DENIED");
        require(residencesOwner[_residenceNum] ==  _memberAddr, "[ERR-10044] MEMBER_IS_NOT_OWNER");
        
        //만약 파라미터로 넘어온 값이 없을 시 기존값을 저장함
        if (keccak256(bytes(_myGeonick)) == keccak256(bytes(""))) {
            _myGeonick = residences[_residenceNum].myGeonick;
        }
        if (keccak256(bytes(_gs1)) == keccak256(bytes(""))) {
            _gs1 = residences[_residenceNum].gs1;
        }
        if (keccak256(bytes(_streetAddress)) == keccak256(bytes(""))) {
            _streetAddress = residences[_residenceNum].streetAddress;
        }
        if (keccak256(bytes(_gridAddress)) == keccak256(bytes(""))) {
            _gridAddress = residences[_residenceNum].gridAddress;
        }
        uint256 previousBlockNum = residences[_residenceNum].blockNumber;
        uint256 currentBlockNum = block.number;
        residences[_residenceNum] = Residence({myGeonick: _myGeonick, gs1: _gs1, streetAddress: _streetAddress, gridAddress: _gridAddress, blockNumber: currentBlockNum});
        emit ChangeResidence(_memberAddr, _residenceNum, currentBlockNum, previousBlockNum, _myGeonick, _gs1, _streetAddress, _gridAddress);
        return true;
    }
    
    //주소지 정보 소유자 이전 (추후 적용예정)
    //---파라미터
    //  _memberAddrFrom: 기존 주소지 소유 회원의 SC주소
    //  _memberAddrTo: 소유 예정된 회원의 SC주소
    //  _residenceNum: 주소지 고유번호
    //---리턴
    function transferOwnershipTo(
        address _memberAddrFrom,
        address _memberAddrTo, 
        uint256 _residenceNum) public returns(bool) {
        require(uniqueResidencesNum[_residenceNum], "[ERR-10050] RESIDENCE_NUM_NOT_EXISTS");
        require(admin == msg.sender || _memberAddrFrom == msg.sender, "[ERR-10053] ACCESS_DENIED");
        require(residencesOwner[_residenceNum] == _memberAddrFrom, "[ERR-10054] FROM_MEMBER_IS_NOT_OWNER");
        require(members[_memberAddrFrom].residencesIndex[_residenceNum] != 0, "[ERR-10055] RESIDENCE_NUM_NOT_FOUND");
        //override and pop 구조의 배열삭제방식(삭제시 0으로 치환되는것을 방지)
        uint256 deleteIndex = members[_memberAddrFrom].residencesIndex[_residenceNum]-1;
        uint256 deleteItem = members[_memberAddrFrom].residencesNum[deleteIndex];
        uint256 lastItem = members[_memberAddrFrom].residencesNum[members[_memberAddrFrom].residencesNumCount-1];
        members[_memberAddrFrom].residencesNum[deleteIndex] = lastItem;
        members[_memberAddrFrom].residencesIndex[deleteItem] = 0;
        members[_memberAddrFrom].residencesIndex[lastItem] = deleteIndex+1;
        members[_memberAddrFrom].residencesNumCount -= 1;
        members[_memberAddrFrom].residencesNum.pop();
        //--!. 주소지 할당되지 않은 MyGeonick값 발생
        residences[_residenceNum].streetAddress = '';
        residences[_residenceNum].gridAddress = '';
        residencesOwner[_residenceNum] = _memberAddrTo;
        //새로운 소유주에게 주소 할당
        members[_memberAddrTo].residencesNum.push(_residenceNum);
        members[_memberAddrTo].residencesNumCount += 1;
        members[_memberAddrTo].residencesIndex[_residenceNum] = members[_memberAddrTo].residencesNumCount;
        return true;
    } 
    
    //주소지 정보 삭제 (업데이트 됨, 세부동작사항은 README 참조)
    //---파라미터
    //  _memberAddr: 회원의 SC주소
    //  _residenceNum: 삭제하고자 하는 주소
    //---리턴
    function deleteResidence(
        address _memberAddr,
        uint256 _residenceNum) public returns(bool) {
        require(uniqueResidencesNum[_residenceNum], "[ERR-10060] RESIDENCE_NUM_NOT_EXISTS");
        require(admin == msg.sender || _memberAddr == msg.sender, "[ERR-10063] ACCESS_DENIED");
        require(residencesOwner[_residenceNum] == _memberAddr, "[ERR-10064] MEMBER_IS_NOT_OWNER");
        require(members[_memberAddr].residencesIndex[_residenceNum] != 0, "[ERR-10065] RESIDENCE_NUM_NOT_FOUND");
        //override and pop 구조의 배열삭제방식(삭제시 0으로 치환되는것을 방지)
        uint256 deleteIndex = members[_memberAddr].residencesIndex[_residenceNum]-1;
        uint256 deleteItem = members[_memberAddr].residencesNum[deleteIndex];
        uint256 lastItem = members[_memberAddr].residencesNum[members[_memberAddr].residencesNumCount-1];
        members[_memberAddr].residencesNum[deleteIndex] = lastItem;
        members[_memberAddr].residencesIndex[deleteItem] = 0;
        members[_memberAddr].residencesIndex[lastItem] = deleteIndex+1;
        members[_memberAddr].residencesNumCount -= 1;
        members[_memberAddr].residencesNum.pop();
        //주소 고유번호의 재할당성을 위한 고유성 해제
        uniqueResidencesNum[_residenceNum] = false;
        //주소 삭제시 블록번호 기록
        uint256 previousBlockNum = residences[_residenceNum].blockNumber;
        uint256 currentBlockNum = block.number;
        //mapping 초기화
        residencesOwner[_residenceNum] = address(0);
        string memory _myGeonick = residences[_residenceNum].myGeonick;
        string memory _gs1 = residences[_residenceNum].gs1;
        string memory _streetAddress = residences[_residenceNum].streetAddress;
        string memory _gridAddress = residences[_residenceNum].gridAddress;
        residences[_residenceNum] = Residence({myGeonick: '', gs1: '', streetAddress: '', gridAddress: '', blockNumber:0});
        emit DeleteResidence(_memberAddr, _residenceNum, currentBlockNum, previousBlockNum, _myGeonick, _gs1, _streetAddress, _gridAddress);
        return true;
    }
    
    //조회가능한 기업 등록 (사전)
    //---파라미터
    //  _memberAddr: 회원의 SC주소
    //  _requester 조회승인된 기업 목록에 포함시킬 기업의 SC주소
    //  _residenceNum 조회승인될 주소의 고유번호
    //  _approvalStatus 조회 승인을 등록할 시 true, 조회 해제를 등록할시 false
    //---리턴
    function allowAccessTo(
        address _memberAddr,
        address _requester, 
        uint256 _residenceNum, 
        bool _approvalStatus) public returns(bool) {
        require(uniqueResidencesNum[_residenceNum], "[ERR-10070] RESIDENCE_NUM_NOT_EXISTS");
        require(admin == msg.sender || _memberAddr == msg.sender, "[ERR-10073] ACCESS_DENIED");
        require(residencesOwner[_residenceNum] == _memberAddr, "[ERR-10074] MEMBER_IS_NOT_OWNER");
        
        residences[_residenceNum].accessApproved[_requester] = _approvalStatus;
        emit PreConsentTo(_memberAddr, _requester, block.number,_residenceNum, _approvalStatus);
        return true;
    }

    //주소지 키값으로 등록된 주소정보 조회(반환)
    //---파라미터
    //  _requestFrom 조회를 요청하는 기업의 기업 SC주소
    //  _residenceNum 조회하고자 하는 주소의 고유번호
    //---리턴
    //  _myGeonick: 마이지오닉 값
    //  _gs1: gs1값
    //  _streetAddress: 도로명 주소
    //  _gridAddress: 지번주소
    function getResidence(
        address _requestFrom,
        uint256 _residenceNum) public returns(
            bool _success, 
            string memory _myGeonick,
            string memory _gs1,
            string memory _streetAddress,
            string memory _gridAddress) {
        require(uniqueResidencesNum[_residenceNum], "[ERR-10080] RESIDENCE_NUM_NOT_EXISTS");
        require(admin == msg.sender || _requestFrom == msg.sender, "[ERR-10083] ACCESS_DENIED");
        //만약 요청자가 사전등록 되어있거나, 본인이거나, 관리자일 시 success true를 반환하며 해당정보를 리턴함
        if(residences[_residenceNum].accessApproved[_requestFrom] || 
            residencesOwner[_residenceNum] == _requestFrom ||
            admin == _requestFrom) {
            _myGeonick = residences[_residenceNum].myGeonick;
            _gs1 = residences[_residenceNum].gs1;
            _streetAddress = residences[_residenceNum].streetAddress;
            _gridAddress = residences[_residenceNum].gridAddress;
            _success = true;
            //사전등록되어 정보를 반환한 기록(이벤트)를 남김
            emit RequestForAddress(_requestFrom, _residenceNum, block.number);
        }
        //만약 요청자가 사전등록되어있지 않으면 success false를 반환하며 해당정보에 빈값을 리턴함
        else {
            //사전등록되지않아 정보를 반환하지 않은 기록을 남김
            _myGeonick = '';
            _gs1 = '';
            _streetAddress = '';
            _gridAddress = '';
            _success = false;
        }
    }

    //실시간 정보조회 승인시 주소정보 조회(반환)
    //---파라미터
    //  _requestFrom 조회를 요청하는 기업의 기업 SC주소
    //  _residenceNum 조회하고자 하는 주소의 고유번호
    //---리턴
    //  _myGeonick: 마이지오닉 값
    //  _gs1: gs1값
    //  _streetAddress: 도로명 주소
    //  _gridAddress: 지번주소
    function getRealtimeConsent(
        address _requestFrom,
        uint256 _residenceNum) public returns(
            bool _success, 
            string memory _myGeonick,
            string memory _gs1,
            string memory _streetAddress,
            string memory _gridAddress) {
        require(uniqueResidencesNum[_residenceNum], "[ERR-10100] RESIDENCE_NUM_NOT_EXISTS");
        require(admin == msg.sender || _requestFrom == msg.sender, "[ERR-10103] ACCESS_DENIED");
        _myGeonick = residences[_residenceNum].myGeonick;
        _gs1 = residences[_residenceNum].gs1;
        _streetAddress = residences[_residenceNum].streetAddress;
        _gridAddress = residences[_residenceNum].gridAddress;
        _success = true;
        emit RequestForAddress(_requestFrom, _residenceNum, block.number);
        emit RealTimeConsentTo(residencesOwner[_residenceNum], _requestFrom, block.number, _residenceNum, true);
    }
    //[[서비스 시스템 유지 및 관리 관련 기능]]
    //사용자에게 등록된 모든 주소지 개수 조회(관리자 및 본인)
    //---파라미터
    //  _memberAddr: 회원의 SC주소
    //---리턴
    //  _residenceNumCount: 조회대상 유저가 가진 주소지 개수
    function getResidenceCount(address _memberAddr) public view returns(bool _success, uint256 _residenceNumCount) {
        require(admin == msg.sender || _memberAddr == msg.sender, "[ERR-10023] ACCESS_DENIED");
        _residenceNumCount = members[_memberAddr].residencesNumCount ;
        _success = true;
    }

    //사용자에게 등록된 모든 주소지 키값 조회 (관리자 및 본인)
    //---파라미터
    //  _memberAddr: 회원의 SC주소
    //---리턴
    //  _residenceList: 조회대상 유저가 가진 주소지의 배열
    function getResidenceList(address _memberAddr) public view returns(bool _success, uint256[] memory _residenceList) {
        require(admin == msg.sender || _memberAddr == msg.sender, "[ERR-10033] ACCESS_DENIED");
        _residenceList = members[_memberAddr].residencesNum;
        _success = true;
    }

    //안심주소 및 gs1코드의 재할당을 위한 고유성 해제
    //---파라미터
    //  _myGeonick: 재할당 하고자하는 안심주소
    //  _gs1: 안심주소와 연관된 gs1 코드
    //---리턴
    function freeMyGeonick(string memory _myGeonick, string memory _gs1) public returns(bool _success) {
        require(admin == msg.sender, "[ERR-10113] ACCESS_DENIED");
        require(uniqueMyGeonick[_myGeonick], "[ERR-10111] MYGEONICK_ALREADY_USABLE");
        require(uniqueGS1Code[_gs1], "[ERR-10042] GS1_CODE_ALREADY_USABLE");
        uniqueMyGeonick[_myGeonick] = false;
        uniqueGS1Code[_gs1] = false;
        return true;
    }
}